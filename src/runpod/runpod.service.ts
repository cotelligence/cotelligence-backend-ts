import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomBytes } from '@noble/hashes/utils';
import { RunpodMint, RunpodStatus } from '@prisma/client';
import axios from 'axios';

import { CommonConfigService } from '../config/common.config.service';
import { FeishuService } from '../helpers/feishu.service';
import { OnChainService } from '../helpers/on-chain.service';
import { MintOwner } from '../nft/nft.types';
import { PrismaService } from '../prisma/prisma.service';
import { fullError } from '../utils/logging';
import { ssh } from '../utils/ssh';
import {
  RunpodData,
  RunpodGetPodByIdRes,
  RunpodIpRes,
  RunpodMintInfo,
  SSHKey,
  StartRunpodRes,
  UpdateRunpodRes,
} from './runpod.type';

@Injectable()
export class RunpodService implements OnModuleInit {
  private logger = new Logger(RunpodService.name);

  constructor(
    private prismaService: PrismaService,
    private configService: CommonConfigService,
    private onChainService: OnChainService,
    private feishuService: FeishuService
  ) {
    this.logger.log('RunpodService initialized');
  }

  async onModuleInit(): Promise<void> {
    await this.startRunpodTransferHook();
  }

  getMintOwners(owner?: string): Promise<MintOwner[]> {
    return this.prismaService.$queryRaw<MintOwner[]>`
    SELECT mint, to_addr AS owner, slot
    FROM (
        SELECT mint, to_addr, RANK() OVER (PARTITION BY mint ORDER BY slot DESC) as rank, slot
        FROM mint_transfer
    ) t
    WHERE rank = 1;
  `.then((res) => res.filter((x) => !owner || x.owner === owner));
  }

  getRunPodMintsByOwner(owner: string): Promise<RunpodMint[]> {
    return this.prismaService.$queryRaw<
      {
        id: number;
        mint: string;
        sig: string;
        runpod_id: string;
        runpod_host_id: string;
        runpod_public_key: string;
        runpod_private_key: string;
        runpod_status: string;
        created_at: Date;
        expire_at: Date;
      }[]
    >`
    SELECT rm.*
    FROM (
        SELECT mint, to_addr AS owner, RANK() OVER (PARTITION BY mint ORDER BY slot DESC) as rank
        FROM mint_transfer
    ) mt
    JOIN runpod_mint rm ON rm.mint = mt.mint
    WHERE mt.rank = 1 AND mt.owner = ${owner};
  `.then((res) =>
      res.map((x) => ({
        id: x.id,
        mint: x.mint,
        sig: x.sig,
        runpodId: x.runpod_id,
        runpodHostId: x.runpod_host_id,
        runpodPublicKey: x.runpod_public_key,
        runpodPrivateKey: x.runpod_private_key,
        runpodStatus: x.runpod_status as RunpodStatus,
        expireAt: x.expire_at,
        createdAt: x.created_at,
      }))
    );
  }

  async getRunpodIp(podId: string): Promise<RunpodIpRes> {
    const getPodData = `query Pod {
  pod(input: {podId: "${podId}"}) {
    id
    name
    runtime {
      uptimeInSeconds
      ports {
        ip
        isIpPublic
        privatePort
        publicPort
        type
      }
      gpus {
        id
        gpuUtilPercent
        memoryUtilPercent
      }
      container {
        cpuPercent
        memoryPercent
      }
    }
  }
}`;
    const getPodRes = await axios
      .post<RunpodGetPodByIdRes>(this.configService.runpodApi, {
        query: getPodData,
      })
      .then((res) => res.data);
    const pod = getPodRes.data.pod;
    if (!pod) {
      this.logger.error(`pod ${podId} not found`);
      return { runpodId: podId };
    }
    if (!pod.runtime || !pod.runtime.ports || pod.runtime.ports.length === 0) {
      return { runpodId: podId };
    }
    const publicIps = getPodRes.data.pod.runtime.ports.filter(
      (port) => port.isIpPublic
    );
    this.logger.log({ ...publicIps, podId });
    if (publicIps.length > 0) {
      return {
        runpodId: podId,
        uptimeInSeconds: pod.runtime.uptimeInSeconds,
        publicIp: publicIps[0].ip,
        publicPort: publicIps[0].publicPort,
      };
    } else {
      return { runpodId: podId, uptimeInSeconds: pod.runtime.uptimeInSeconds };
    }
  }

  async runpodMintInfoList(owner: string): Promise<RunpodMintInfo[]> {
    // get mint from mint_transfer table
    // find runpodMints by token owner
    const runpodMints = await this.getRunPodMintsByOwner(owner);
    const res: RunpodMintInfo[] = [];
    for (let i = 0; i < runpodMints.length; i++) {
      const runpodMint = runpodMints[i];
      // if runpod has not started
      if (runpodMint.runpodId == null) {
        res.push({ ...runpodMint, owner });
        continue;
      }
      const runpodIpRes = await this.getRunpodIp(runpodMint.runpodId);
      res.push({
        ...runpodMint,
        owner,
        runpodPublicIp: runpodIpRes.publicIp,
        runpodPort: runpodIpRes.publicPort,
        runpodUptimeInSeconds: runpodIpRes.uptimeInSeconds,
      });
    }
    return res;
  }

  async openRunpodRequest(sshPublicKey: string): Promise<RunpodData> {
    const data = {
      query: `mutation podFindAndDeployOnDemandJob($input: PodFindAndDeployOnDemandInput!) {
      podFindAndDeployOnDemand(input: $input) {
        id
        imageName
        env
        machineId
        machine {
          podHostId
        }
      }
    }`,
      variables: {
        input: {
          cloudType: 'COMMUNITY',
          gpuCount: 1,
          startSsh: true,
          volumeInGb: 20,
          containerDiskInGb: 20,
          minVcpuCount: 2,
          minMemoryInGb: 15,
          gpuTypeId: 'NVIDIA RTX A4500',
          name: 'RunPod Tensorflow',
          imageName: 'runpod/tensorflow',
          dockerArgs: '',
          ports: '8888/http,22/tcp',
          volumeMountPath: '/workspace',
          env: [{ key: 'PUBLIC_KEY', value: sshPublicKey }],
        },
      },
    };
    const startRes = await axios
      .post<StartRunpodRes>(this.configService.runpodApi, data)
      .then((res) => res.data);
    this.logger.log({ startRunpodRes: startRes }, 'Start runpod request sent!');
    if (startRes.errors) {
      throw new Error(
        `Failed to start runpod: ${JSON.stringify(startRes.errors)},`
      );
    }
    return {
      runpodId: startRes.data.podFindAndDeployOnDemand.id,
      podHostId: startRes.data.podFindAndDeployOnDemand.machine.podHostId,
    };
  }

  async updateRunpodRequest(
    podId: string,
    sshPublicKey: string
  ): Promise<void> {
    const data = {
      query: `mutation editPodJob($input: PodEditJobInput!) {
      podEditJob(input: $input) {
        id
        env
        port
        ports
        dockerArgs
        imageName
        containerDiskInGb
        volumeMountPath
        __typename
      }
    }`,
      variables: {
        input: {
          podId: podId,
          imageName: 'runpod/tensorflow',
          containerDiskInGb: 20,
          volumeInGb: 20,
          ports: '8888/http,22/tcp',
          volumeMountPath: '/workspace',
          env: [
            {
              key: 'PUBLIC_KEY',
              value: sshPublicKey,
            },
          ],
        },
      },
    };
    const updateRes = await axios
      .post<UpdateRunpodRes>(this.configService.runpodApi, data)
      .then((res) => res.data);
    this.logger.log({ updateRes }, 'Update runpod pod request sent!');
    if (updateRes.errors) {
      throw new Error(
        `Failed to update runpod: ${JSON.stringify(updateRes.errors)},`
      );
    }
  }

  async startRunpod(
    mint: string,
    signer: string
  ): Promise<RunpodMintInfo | undefined> {
    // start runpod
    this.logger.log('Starting runpod ...');
    // get runpodMint record
    const runpodMint = await this.prismaService.runpodMint.findFirstOrThrow({
      where: {
        mint,
      },
    });
    if (
      runpodMint.runpodStatus !== 'Error' &&
      runpodMint.runpodStatus !== 'NotStarted'
    ) {
      throw new Error(`RunpodMint for mint ${mint} already started`);
    }
    // update runpodMint status to starting
    await this.prismaService.runpodMint.update({
      where: { mint },
      data: {
        runpodStatus: 'Starting',
      },
    });
    // get current owner of mint
    const mintTransfer = await this.onChainService.getLatestTransfers(mint, 1);
    const owner = mintTransfer[0].toAddr;
    // assert signer is current owner
    if (signer !== owner) {
      throw new Error('Signer is not the owner of mint');
    }
    let runpodData: RunpodData;
    let sshKey: SSHKey;
    try {
      sshKey = await this.genSSHKey(owner);
      runpodData = await this.openRunpodRequest(sshKey.publicKey);
      this.logger.log({ runpodData });
      await this.prismaService.runpodMint.update({
        where: { mint },
        data: {
          sig: runpodMint.sig,
          runpodId: runpodData.runpodId,
          runpodHostId: runpodData.podHostId,
          runpodPublicKey: sshKey.publicKey,
          runpodPrivateKey: sshKey.privateKey,
          runpodStatus: 'Running',
          // set expire time to 30 days
          expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      });
    } catch (e) {
      this.logger.error(`open runpod pod failed: ${e}`);
      await this.prismaService.runpodMint.update({
        where: { mint },
        data: {
          runpodStatus: 'Error',
        },
      });
      throw e;
    }
    // get runpod mint
    const data = await this.prismaService.runpodMint.findFirst({
      where: {
        mint,
      },
    });
    return {
      ...data,
      mint,
      owner,
    };
  }

  /**
   * Update runpod with new ssh public key while transferring ownership for a running runpod
   * If runpod is not running, do nothing
   * @param mint
   */
  async updateRunpod(mint: string): Promise<void> {
    // update runpod
    this.logger.log('Updating runpod ...');
    // get runpodMint record
    const runpodMint = await this.prismaService.runpodMint.findFirstOrThrow({
      where: {
        mint,
      },
    });
    // update ssh public key for runpod only if runpod has runpodId
    if (!runpodMint.runpodId) {
      return;
    }
    // get current owner of mint
    const mintTransfer = await this.onChainService.getLatestTransfers(mint, 1);
    const owner = mintTransfer[0].toAddr;
    // gen new ssh key
    const sshKey = await this.genSSHKey(owner);
    // update runpod by runpod api
    await this.updateRunpodRequest(runpodMint.runpodId, sshKey.publicKey);
    // update runpodMint record with the new ssh key
    await this.feishuService.feishuMessage(
      `Updating runpod ssh public key for mint ${mint}, podId ${runpodMint.runpodId} ...`
    );
    await this.prismaService.runpodMint.update({
      where: { mint },
      data: {
        runpodPrivateKey: sshKey.privateKey,
        runpodPublicKey: sshKey.publicKey,
      },
    });
  }

  async startRunpodTransferHook(): Promise<void> {
    setTimeout(async () => {
      try {
        // process earlier mint transfers first
        const mintTransfers = await this.prismaService.mintTransfer.findMany({
          where: { sshPubkeyUpdated: false },
          orderBy: [{ slot: 'asc' }, { createdAt: 'asc' }],
        });
        for (const mintTransfer of mintTransfers) {
          try {
            this.logger.log(
              `Transfer found! Updating public key of runpod for mint ${mintTransfer.mint} ...`
            );
            await this.updateRunpod(mintTransfer.mint);
            await this.prismaService.mintTransfer.update({
              where: { id: mintTransfer.id },
              data: { sshPubkeyUpdated: true },
            });
          } catch (e) {
            this.logger.error(
              { error: fullError(e) },
              `Update runpod failed for mint ${mintTransfer.mint}`
            );
          }
        }
      } catch (e) {
        this.logger.error(
          { error: fullError(e) },
          'Error occurred in startRunpodTransferHook'
        );
      } finally {
        // reschedule the hook in case of any error
        await this.startRunpodTransferHook();
      }
    }, 1_000);
  }

  async genSSHKey(owner: string): Promise<SSHKey> {
    const seed = randomBytes(32);
    return ssh(seed, owner);
  }
}
