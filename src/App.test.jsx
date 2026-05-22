// @vitest-environment jsdom
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders title screen for debt roguelike puzzle MVP", () => {
  render(<App />);

  expect(screen.getByLabelText("貸した魔力はリボ払いで強制徴収")).toBeDefined();
  expect(screen.getByText("GAME START")).toBeDefined();
  expect(screen.getByText(/現在の状態：青/)).toBeDefined();
  expect(screen.getByText("高利貸し")).toBeDefined();
});
