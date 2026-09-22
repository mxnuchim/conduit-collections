import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddToCollectionButton from "./AddToCollectionButton";
import getCollections from "../../services/getCollections";
import addArticleToCollection from "../../services/addArticleToCollection";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ headers: { Authorization: "Token x" }, isAuth: true }),
}));
vi.mock("../../services/getCollections", () => ({ default: vi.fn() }));
vi.mock("../../services/createCollection", () => ({ default: vi.fn() }));
vi.mock("../../services/addArticleToCollection", () => ({ default: vi.fn() }));

describe("AddToCollectionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads collections when opened and saves the article", async () => {
    getCollections.mockResolvedValue({
      collections: [{ id: 7, name: "Weekend Reading", articlesCount: 0 }],
    });
    addArticleToCollection.mockResolvedValue({});

    render(<AddToCollectionButton slug="my-article" />);
    await userEvent.click(screen.getByTestId("save-to-collection"));

    const option = await screen.findByText("Weekend Reading");
    await userEvent.click(option);

    expect(addArticleToCollection).toHaveBeenCalledWith({
      id: 7,
      slug: "my-article",
      headers: expect.any(Object),
    });
    expect(await screen.findByTestId("save-status")).toHaveTextContent("Saved");
  });

  test("shows an empty state when there are no collections", async () => {
    getCollections.mockResolvedValue({ collections: [] });

    render(<AddToCollectionButton slug="my-article" />);
    await userEvent.click(screen.getByTestId("save-to-collection"));

    expect(await screen.findByText("No collections yet")).toBeInTheDocument();
  });

  test("surfaces a duplicate (409) error from the backend", async () => {
    getCollections.mockResolvedValue({
      collections: [{ id: 7, name: "Weekend Reading", articlesCount: 1 }],
    });
    addArticleToCollection.mockRejectedValue("Article is already in this collection");

    render(<AddToCollectionButton slug="my-article" />);
    await userEvent.click(screen.getByTestId("save-to-collection"));
    await userEvent.click(await screen.findByText("Weekend Reading"));

    await waitFor(() =>
      expect(screen.getByTestId("save-error")).toHaveTextContent(
        "Article is already in this collection",
      ),
    );
  });
});
