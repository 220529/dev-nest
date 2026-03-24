import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LegacyErpAdapterService } from './compat/legacy-erp-adapter.service';
import { ImportController } from './import.controller';
import { ImportExecutorService } from './executor/import-executor.service';
import { ImportOrchestratorService } from './orchestrator/import-orchestrator.service';
import { ExcelParserService } from './parser/excel-parser.service';
import { ImportSceneRegistry } from './registry/import-scene.registry';
import { RunflowClientService } from './runflow/runflow-client.service';
import { SettlementScene } from './scenes/settlement/settlement.scene';

@Module({
  imports: [HttpModule],
  controllers: [ImportController],
  providers: [
    ImportExecutorService,
    ImportOrchestratorService,
    LegacyErpAdapterService,
    ExcelParserService,
    ImportSceneRegistry,
    RunflowClientService,
    SettlementScene,
  ],
  exports: [
    ImportOrchestratorService,
    LegacyErpAdapterService,
    ExcelParserService,
    RunflowClientService,
    SettlementScene,
  ],
})
export class ImportModule {}
