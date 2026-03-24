import { BadRequestException, Injectable } from '@nestjs/common';
import { ImportScene } from '../scenes/import-scene.interface';
import { SettlementScene } from '../scenes/settlement/settlement.scene';

@Injectable()
export class ImportSceneRegistry {
  private readonly sceneMap = new Map<string, ImportScene>();

  constructor(private readonly settlementScene: SettlementScene) {
    this.sceneMap.set(this.settlementScene.scene, this.settlementScene);
  }

  get(scene: string): ImportScene {
    const target = this.sceneMap.get(scene);

    if (!target) {
      throw new BadRequestException(`不支持的导入场景: ${scene}`);
    }

    return target;
  }
}
