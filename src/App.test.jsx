// @vitest-environment jsdom
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders title screen for debt roguelike puzzle MVP", () => {
  render(<App />);

  expect(screen.getByLabelText("貸した魔力はリボ払いで強制徴収")).toBeDefined();
  expect(screen.getByRole("button", { name: "START →" })).toBeDefined();
  expect(screen.getByText(/借金で快楽を前借りするローグライク/)).toBeDefined();
  expect(screen.getByLabelText("ルールはカンタン")).toBeDefined();
  expect(screen.getByText(/貸した魔力には、必ず利息/)).toBeDefined();
});
