import { Injectable } from '@nestjs/common';


@Injectable()
export class AppService {
  health(): { health: true } {
    return { health: true };
  }
}
