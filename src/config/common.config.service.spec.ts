import { setupConfigService } from '../__tests__/utils.spec';
import { CommonConfigService } from './common.config.service';

describe('configService', () => {
  let configService: CommonConfigService;
  it('should get LOGGER_LEVEL', async () => {
    configService = setupConfigService();
    expect(configService.loggerLevel).toBe('debug');
  });
});
