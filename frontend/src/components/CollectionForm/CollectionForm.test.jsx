import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CollectionForm from "./CollectionForm";

describe("CollectionForm", () => {
  test("disables submit until a name is entered", async () => {
    render(<CollectionForm onSubmit={() => Promise.resolve()} />);

    const submit = screen.getByTestId("collection-form-submit");
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText("Collection name"), "Reading");
    expect(submit).toBeEnabled();
  });

  test("submits trimmed values and resets in create mode", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<CollectionForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByPlaceholderText("Collection name"), "  Reading  ");
    await userEvent.type(
      screen.getByPlaceholderText("Description (optional)"),
      "  later  ",
    );
    await userEvent.click(screen.getByTestId("collection-form-submit"));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Reading", description: "later" });
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Collection name")).toHaveValue(""),
    );
  });

  test("surfaces a backend error when the submit fails", async () => {
    const onSubmit = vi.fn(() => Promise.reject("Name already taken"));
    render(<CollectionForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByPlaceholderText("Collection name"), "Reading");
    await userEvent.click(screen.getByTestId("collection-form-submit"));

    expect(await screen.findByTestId("collection-form-error")).toHaveTextContent(
      "Name already taken",
    );
  });
});
