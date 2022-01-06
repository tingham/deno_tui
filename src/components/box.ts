// Copyright 2021 Im-Beast. All rights reserved. MIT license.
import { drawRectangle } from "../canvas.ts";
import { TuiStyler } from "../tui.ts";
import {
  createComponent,
  CreateComponentOptions,
  ExtendedComponent,
  getCurrentStyler,
  removeComponent,
} from "../tui_component.ts";
import { TuiObject } from "../types.ts";
import { createFrame, FrameComponent } from "./frame.ts";

export type FrameAssignment =
  & ({ enabled: true; styler: TuiStyler } | {
    enabled: false;
    styler?: TuiStyler;
  })
  & { rounded?: boolean };

/** Not interactive box component */
export type BoxComponent = ExtendedComponent<"box", {
  frame: FrameAssignment;
}>;

export type CreateBoxOptions =
  & Omit<
    CreateComponentOptions,
    "interactive" | "name" | "draw" | "update"
  >
  & {
    interactive?: boolean;
    frame?: FrameAssignment;
  };

/**
 * Create BoxComponent
 *
 * It is not interactive by default
 * @param parent - parent of the created box, either tui or other component
 * @param options
 * @example
 * ```ts
 * const tui = createTui(...);
 * ...
 * createBox(tui, {
 *  rectangle: {
 *    column: 2,
 *    row: 2,
 *    width: 10,
 *    height: 5
 *  }
 * })
 * ```
 */
export function createBox(
  parent: TuiObject,
  options: CreateBoxOptions,
): BoxComponent {
  let frame: FrameComponent | undefined;

  const box: BoxComponent = createComponent(parent, options, {
    name: "box",
    interactive: false,
    update(this: BoxComponent) {
      if (frame && !box.frame.enabled) {
        removeComponent(frame);
        frame = undefined;
        return;
      }

      if (!!frame === !!box.frame?.enabled) return;

      frame = createFrame(box, {
        get rectangle() {
          const { column, row, width, height } = box.rectangle;
          return {
            column: column - 1,
            row: row - 1,
            width: width + 1,
            height: height + 1,
          };
        },
        get styler() {
          return box.frame.styler ?? box.styler;
        },
        get rounded() {
          return box.frame.rounded ?? false;
        },
      });
    },
    draw(this: BoxComponent) {
      drawRectangle(box.tui.canvas, {
        ...box.rectangle,
        styler: getCurrentStyler(box),
      });
    },
    frame: options.frame ?? {
      enabled: false,
    },
  });

  return box;
}
