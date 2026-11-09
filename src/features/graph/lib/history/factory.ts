import { Restore } from "@/features/graph/types/restores";
import { RestoreObject } from "@/features/graph/types/RestoreObject";
import { NodeAddRestoreObject } from "@/features/graph/lib/history/NodeAddRestore";
import { NodeRemoveRestoreObject } from "@/features/graph/lib/history/NodeRemoveRestore";
import { NodeSizeRestoreObject } from "@/features/graph/lib/history/NodeResizeRestore";
import { NodeShiftRestoreObjet } from "@/features/graph/lib/history/NodeShiftRestore";
import { NodeDataRestoreObjet } from "@/features/graph/lib/history/NodeDataRestore";
import { EdgeRemoveRestoreObject } from "@/features/graph/lib/history/EdgeRemoveRestore";
import { EdgeAddRestoreObject } from "@/features/graph/lib/history/EdgeAddRestore";
import { EdgeDataRestoreObject } from "@/features/graph/lib/history/EdgeDataRestore";
import { NormalizingFullRestoreObject } from "@/features/graph/lib/history/NormalizingFullRestore";
import { ClearBoardRestoreObject } from "@/features/graph/lib/history/ClearBoardRestore";
import { NodeMassMovementRestoreObject } from "@/features/graph/lib/history/NodeMassMovement";
import { NodeMassDeleteRestoreObject } from "@/features/graph/lib/history/NodeMassDelete";
import { EdgeMassDeleteRestoreObject } from "@/features/graph/lib/history/EdgeMassDeleteRestore";
import { PasteRestoreObject } from "@/features/graph/lib/history/PasteRestore";

export class RestoreObjectFactory {
  public static create(restore: Restore): RestoreObject {
    switch (restore.type) {
      case "node:add":
        return new NodeAddRestoreObject(restore);
      case "node:remove":
        return new NodeRemoveRestoreObject(restore);
      case "node:change_size":
        return new NodeSizeRestoreObject(restore);
      case "node:change_shift":
        return new NodeShiftRestoreObjet(restore);
      case "node:change_data":
        return new NodeDataRestoreObjet(restore);
      case "edge:remove":
        return new EdgeRemoveRestoreObject(restore);
      case "edge:add":
        return new EdgeAddRestoreObject(restore);
      case "edge:change_data":
        return new EdgeDataRestoreObject(restore);
      case "normalizing:full_backup":
        return new NormalizingFullRestoreObject(restore);
      case "graph:clear":
        return new ClearBoardRestoreObject(restore);
      case "node:mass_movement":
        return new NodeMassMovementRestoreObject(restore);
      case "node:mass_delete":
        return new NodeMassDeleteRestoreObject(restore);
      case "edge:mass_delete":
        return new EdgeMassDeleteRestoreObject(restore);
      case "all:paste":
        return new PasteRestoreObject(restore);
      default:
        throw new Error(`Unknown restore type: ${(restore as any).type}`);
    }
  }
}
