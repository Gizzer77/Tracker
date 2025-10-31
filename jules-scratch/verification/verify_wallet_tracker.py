
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")
    page.wait_for_selector(".loading", state="hidden")

    # Add a parent wallet
    page.get_by_role("button", name="+ Add Wallet").click()
    page.fill("input[placeholder='Wallet Address (0x...)']", "0xParent")
    page.fill("input[placeholder='Wallet Name (e.g., My Main Wallet)']", "Parent Wallet")
    page.get_by_role("button", name="Save Wallet").click()

    # Add a child wallet
    page.get_by_role("button", name="+ Add Wallet").click()
    page.fill("input[placeholder='Wallet Address (0x...)']", "0xChild")
    page.fill("input[placeholder='Wallet Name (e.g., My Main Wallet)']", "Child Wallet")
    page.get_by_role("button", name="Save Wallet").click()

    # Expand the parent wallet
    page.get_by_text("Parent Wallet").click()
    page.wait_for_selector(".combined-holdings-section")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
