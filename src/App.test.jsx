// @vitest-environment jsdom
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders title screen for debt roguelike puzzle MVP", () => {
  render(<App />);

  expect(screen.getByLabelText("GREED CHAIN")).toBeDefined();
  expect(screen.getByText("VER 1.0.0")).toBeDefined();
  expect(screen.getByRole("button", { name: "お知らせ" })).toBeDefined();
  expect(screen.getByRole("button", { name: "メニュー" })).toBeDefined();
  expect(screen.getByRole("button", { name: "TOUCH TO START" })).toBeDefined();
  expect(screen.getByText(/貸した魔力はリボ払いで/)).toBeDefined();
});
