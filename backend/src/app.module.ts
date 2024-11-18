import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { AIModule } from './ai/ai.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../.env'),
      cache: false,
    }),
    GameModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
