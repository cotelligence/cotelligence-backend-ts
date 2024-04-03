import { RunpodStatus } from '@prisma/client';

export type RunpodIpRes = {
  runpodId: string;
  uptimeInSeconds?: number;
  publicIp?: string;
  publicPort?: number;
};

export type RunpodMintInfo = {
  id?: number;
  mint: string;
  owner: string;
  sig?: string;
  runpodId?: string | null;
  runpodHostId?: string | null;
  runpodPublicIp?: string | null;
  runpodPort?: number | null;
  runpodUptimeInSeconds?: number | null;
  runpodPublicKey?: string | null;
  runpodPrivateKey?: string | null;
  runpodStatus?: RunpodStatus;
  expireAt?: Date | null;
};

export type SSHKey = {
  publicKey: string;
  privateKey: string;
};

export type RunpodGetPodByIdRes = {
  data: {
    pod: {
      id: string;
      name: string;
      runtime: {
        uptimeInSeconds: number;
        ports: {
          ip: string;
          isIpPublic: boolean;
          privatePort: number;
          publicPort: number;
          type: string;
        }[];
        gpus: {
          id: string;
          gpuUtilPercent: number;
          memoryUtilPercent: number;
        }[];
        container: {
          cpuPercent: number;
          memoryPercent: number;
        };
      };
    };
  };
};

export type RunpodData = {
  runpodId: string;
  podHostId: string;
};

export type UpdateRunpodRes = {
  errors?: RunpodError[];
  data: { podEditJob: { id: string } | null };
};

export type StartPodPayload = {
  mint: string;
  sig: string;
  signer: string;
};

export type StartRunpodRes = {
  data: {
    podFindAndDeployOnDemand: {
      id: string;
      imageName: string;
      env: string[];
      machineId: string;
      machine: {
        podHostId: string;
      };
    };
  };
  errors?: RunpodError[];
};

type RunpodError = {
  message: string;
  locations?: { line: number; column: number }[];
  extensions?: { code: string };
};
