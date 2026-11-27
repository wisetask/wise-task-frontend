import { describe, expect, it } from "vitest";
import { addVertex, createEmptyGraph } from "@/entities/graph";
import { graphEgg, textEgg } from "./constructorEggs";
import { buildTemplate } from "./graphTemplates";

function eggId(id: Parameters<typeof buildTemplate>[0]): string {
  const egg = graphEgg(buildTemplate(id, false));
  return egg === null ? "" : egg.id;
}

describe("constructor easter eggs", () => {
  it("notices famous graphs", () => {
    expect(eggId("complete")).toBe("k5");
    expect(eggId("bipartite")).toBe("k33");
    expect(eggId("petersen")).toBe("petersen");
    expect(eggId("cube")).toBe("");
    expect(eggId("cycle")).toBe("");
  });

  it("notices a huge graph", () => {
    let graph = createEmptyGraph(false);
    for (let index = 0; index < 50; index++) {
      graph = addVertex(graph, index * 10, 0);
    }
    const egg = graphEgg(graph);
    expect(egg === null ? "" : egg.id).toBe("big");
  });

  it("reads famous words in the task text", () => {
    const konigsberg = textEgg("Мосты", "Пройдите по мостам Кёнигсберга");
    expect(konigsberg === null ? "" : konigsberg.id).toBe("konigsberg");
    const envelope = textEgg("Конверт", "");
    expect(envelope === null ? "" : envelope.sketch).toBe("envelope");
    const petersen = textEgg("", "Граф ПЕТЕРСЕНА");
    expect(petersen === null ? "" : petersen.sketch).toBe("petersen");
    expect(textEgg("Дерево", "Нарисуйте дерево")).toBeNull();
  });
});
