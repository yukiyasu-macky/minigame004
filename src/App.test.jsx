// @vitest-environment jsdom
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders debt roguelike puzzle MVP", () => {
  render(<App />);

  expect(screen.getByText("通常戦1")).toBeDefined();
  expect(screen.getByText(/現在チェイン/)).toBeDefined();
  expect(screen.getByText(/借金状態/)).toBeDefined();
});
