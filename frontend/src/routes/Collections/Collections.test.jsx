import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Collections from "./Collections";
import getCollections from "../../services/getCollections";
import createCollection from "../../services/createCollection";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ headers: { Authorization: "Token x" }, isAuth: true }),
}));
vi.mock("../../services/getCollections", () => ({ default: vi.fn() }));
vi.mock("../../services/createCollection", () => ({ default: vi.fn() }));
vi.mock("../../services/updateCollection", () => ({ default: vi.fn() }));
vi.mock("../../services/deleteCollection", () => ({ default: vi.fn() }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <Collections />
    </MemoryRouter>,
  );

describe("Collections page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows the empty state when the user has no collections", async () => {
    getCollections.mockResolvedValue({ collections: [], collectionsCount: 0 });

    renderPage();
    expect(await screen.findByTestId("collections-empty")).toBeInTheDocument();
  });

  test("renders the list of collections", async () => {
    getCollections.mockResolvedValue({
      collections: [
        { id: 1, name: "Reading", description: "later", articlesCount: 2 },
        { id: 2, name: "Research", description: null, articlesCount: 0 },
      ],
      collectionsCount: 2,
    });

    renderPage();
    expect(await screen.findByText("Reading")).toBeInTheDocument();
    expect(screen.getByText("Research")).toBeInTheDocument();
  });

  test("creates a collection and prepends it to the list", async () => {
    getCollections.mockResolvedValue({ collections: [], collectionsCount: 0 });
    createCollection.mockResolvedValue({ id: 9, name: "New list", description: "" });

    renderPage();
    await screen.findByTestId("collections-empty");

    await userEvent.type(
      screen.getByPlaceholderText("Collection name"),
      "New list",
    );
    await userEvent.click(screen.getByTestId("collection-form-submit"));

    expect(createCollection).toHaveBeenCalledWith({
      name: "New list",
      description: "",
      headers: expect.any(Object),
    });
    await waitFor(() =>
      expect(screen.getByTestId("collections-list")).toHaveTextContent("New list"),
    );
  });

  test("shows an error state when loading fails", async () => {
    getCollections.mockRejectedValue("Something went wrong");

    renderPage();
    expect(await screen.findByTestId("collections-error")).toHaveTextContent(
      "Something went wrong",
    );
  });
});
