// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import { emptyAnswers, type Answers } from "../lib/cells";
import RelationMatrix from "./RelationMatrix.vue";

enableAutoUnmount(afterEach);

const EXPECTED = [
  [1, 0],
  [2, 1],
];

function mountInput(showResult: boolean) {
  const wrapper = mount(RelationMatrix, {
    attachTo: document.body,
    props: {
      editable: true,
      expected: EXPECTED,
      showResult: showResult,
      answers: emptyAnswers(2),
      "onUpdate:answers": (value: Answers) => wrapper.setProps({ answers: value }),
    },
  });
  return wrapper;
}

function answerAt(wrapper: ReturnType<typeof mountInput>, row: number, col: number) {
  const answers = wrapper.props("answers") as Answers;
  return answers[row][col];
}

describe("relation matrix", () => {
  it("shows a matrix with row and column numbers", () => {
    const wrapper = mount(RelationMatrix, { props: { title: "A", values: EXPECTED } });
    expect(wrapper.find(".relation-matrix__title").text()).toBe("A");
    const heads = wrapper.findAll("thead .relation-matrix__head").map((head) => head.text());
    expect(heads).toEqual(["1", "2"]);
    const cells = wrapper.findAll(".relation-matrix__cell").map((cell) => cell.text());
    expect(cells).toEqual(["1", "0", "2", "1"]);
    expect(wrapper.findAll(".relation-matrix__cell--zero").length).toBe(1);
    expect(wrapper.find("input").exists()).toBe(false);
  });

  it("takes numbers typed into the cells and ignores other text", async () => {
    const wrapper = mountInput(false);
    const inputs = wrapper.findAll("input");
    await inputs[2].setValue("2");
    expect(answerAt(wrapper, 1, 0)).toBe(2);
    await inputs[0].setValue("x");
    expect(answerAt(wrapper, 0, 0)).toBeNull();
    expect((inputs[0].element as HTMLInputElement).value).toBe("");
    await inputs[2].setValue("");
    expect(answerAt(wrapper, 1, 0)).toBeNull();
  });

  it("colors answers only when results are shown", async () => {
    const hidden = mountInput(false);
    await hidden.findAll("input")[0].setValue("5");
    expect(hidden.find(".relation-matrix__cell--wrong").exists()).toBe(false);
    expect(hidden.find(".relation-matrix__cell--filled").exists()).toBe(true);

    const shown = mountInput(true);
    const inputs = shown.findAll("input");
    await inputs[0].setValue("1");
    await inputs[1].setValue("3");
    expect(shown.findAll(".relation-matrix__cell--correct").length).toBe(1);
    expect(shown.findAll(".relation-matrix__cell--wrong").length).toBe(1);
  });

  it("moves to the next cell with arrows and Enter", async () => {
    const wrapper = mountInput(false);
    const inputs = wrapper.findAll("input");
    await inputs[0].trigger("keydown", { key: "ArrowRight" });
    expect(document.activeElement).toBe(inputs[1].element);
    await inputs[1].trigger("keydown", { key: "Enter" });
    expect(document.activeElement).toBe(inputs[2].element);
    await inputs[2].trigger("keydown", { key: "ArrowUp" });
    expect(document.activeElement).toBe(inputs[0].element);
  });

  it("tells which cell is under the mouse", async () => {
    const wrapper = mount(RelationMatrix, { props: { values: EXPECTED } });
    await wrapper.findAll(".relation-matrix__cell")[3].trigger("mouseenter");
    await wrapper.find("table").trigger("mouseleave");
    expect(wrapper.emitted("hover")).toEqual([[{ row: 1, col: 1 }], [null]]);
  });

  it("outlines the highlighted cell", () => {
    const wrapper = mount(RelationMatrix, {
      props: { values: EXPECTED, highlight: { row: 0, col: 1 } },
    });
    const cells = wrapper.findAll(".relation-matrix__cell");
    expect(cells[1].classes()).toContain("relation-matrix__cell--highlight");
    expect(cells[0].classes()).not.toContain("relation-matrix__cell--highlight");
  });
});
