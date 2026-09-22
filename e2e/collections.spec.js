import { test, expect } from "@playwright/test";

const API = "http://localhost:3001";

// Seed a dedicated user and article through the API so the flow is deterministic
// and independent of any other data or test order.
async function seed(playwright) {
  const api = await playwright.request.newContext({ baseURL: API });
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const account = {
    username: `e2e_${suffix}`,
    email: `e2e_${suffix}@test.com`,
    password: "password123",
  };

  const register = await api.post("/api/users", { data: { user: account } });
  const { user } = await register.json();

  const articleRes = await api.post("/api/articles", {
    headers: { Authorization: `Token ${user.token}` },
    data: {
      article: {
        title: `E2E Article ${suffix}`,
        description: "seeded for e2e",
        body: "body",
        tagList: [],
      },
    },
  });
  const { article } = await articleRes.json();
  await api.dispose();

  return { account, articleTitle: article.title, articleSlug: article.slug };
}

test("login → create collection → save article → view it → remove it", async ({
  page,
  playwright,
}) => {
  const { account, articleTitle, articleSlug } = await seed(playwright);

  // Login through the UI.
  await page.goto("/#/login");
  await page.getByPlaceholder("Email").fill(account.email);
  await page.getByPlaceholder("Password").fill(account.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("link", { name: /New Article/ })).toBeVisible();

  // Create a collection.
  await page.goto("/#/collections");
  await page.getByPlaceholder("Collection name").fill("E2E Collection");
  await page.getByTestId("collection-form-submit").click();
  await expect(page.getByTestId("collections-list")).toContainText("E2E Collection");

  // Save the seeded article into the collection from the article page.
  await page.goto(`/#/article/${articleSlug}`);
  await page.getByTestId("save-to-collection").first().click();
  await page.getByTestId("collection-option").first().click();
  await expect(page.getByTestId("save-status").first()).toHaveText("Saved");

  // Open the collection and confirm the article is listed.
  await page.goto("/#/collections");
  await page.getByRole("link", { name: "Open" }).first().click();
  await expect(page.getByTestId("collection-articles")).toContainText(articleTitle);

  // Remove it and confirm the empty state.
  await page.getByTestId("remove-article").first().click();
  await expect(page.getByTestId("collection-empty")).toBeVisible();
  await expect(page.getByText(articleTitle)).toHaveCount(0);
});
