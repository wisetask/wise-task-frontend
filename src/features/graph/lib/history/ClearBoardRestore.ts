import { RestoreObject } from "@/features/graph/types/RestoreObject";
import { ClearBoardRestore, Restore } from "@/features/graph/types/restores";
import { NodesStoreState } from "@/features/graph/types/NodesStore";

export class ClearBoardRestoreObject extends RestoreObject {
  private readonly prevState: NodesStoreState;

  constructor(properties: ClearBoardRestore) {
    super(properties as Restore);
    this.prevState = JSON.parse(JSON.stringify(properties.properties.state));
  }

  public restore = (): NodesStoreState => {
    return { ...this.prevState };
  };
}
