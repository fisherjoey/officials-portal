"""
Test OSA Request Form business logic validation
Multi-step wizard form test
"""
from playwright.sync_api import sync_playwright
import sys

def test_osa_form():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("=" * 60)
        print("OSA FORM VALIDATION TESTS")
        print("=" * 60)

        # Navigate to the form
        print("\nNavigating to page...")
        page.goto('http://localhost:3000/get-officials', wait_until='domcontentloaded')

        # Wait for page to fully load
        page.wait_for_timeout(5000)

        # Scroll to form section
        page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        page.wait_for_timeout(2000)

        # Wait for the form to load
        print("Waiting for form to load...")
        try:
            page.wait_for_selector('#organizationName', timeout=15000)
            print("Form loaded - Organization Name field found")
        except:
            print("Warning: Organization Name field not found")
            page.screenshot(path='/tmp/osa-debug.png', full_page=True)
            print("Debug screenshot saved")

        tests_passed = 0
        tests_failed = 0

        # ==========================================
        # STEP 1: Organization Information
        # ==========================================
        print("\n[STEP 1] Organization Information")

        try:
            org_input = page.locator('#organizationName')
            org_input.fill('Test Basketball League')
            print("  Filled organization name")

            # Click Next button (use exact=True to avoid Next.js dev tools button)
            next_btn = page.get_by_role('button', name='Next', exact=True)
            next_btn.click()
            page.wait_for_timeout(1000)
            print("  Clicked Next -> Step 2 (Billing)")
        except Exception as e:
            print(f"  [FAIL] Step 1 error: {e}")
            tests_failed += 1

        # Take screenshot of step 2
        page.screenshot(path='/tmp/osa-step2.png', full_page=True)
        print("Step 2 screenshot saved")

        # ==========================================
        # TEST 1: Phone number auto-formatting (Billing step)
        # ==========================================
        print("\n[TEST 1] Phone number auto-formatting")

        try:
            billing_phone = page.locator('#billingPhone')
            billing_phone.wait_for(timeout=5000)
            billing_phone.fill('')
            billing_phone.type('4035551234', delay=50)
            phone_value = billing_phone.input_value()
            print(f"  Phone value after typing: '{phone_value}'")

            if phone_value == '(403) 555-1234':
                print("  [PASS] Phone formatted correctly as (403) 555-1234")
                tests_passed += 1
            else:
                print(f"  [FAIL] Expected '(403) 555-1234', got '{phone_value}'")
                tests_failed += 1
        except Exception as e:
            print(f"  [FAIL] Error: {e}")
            tests_failed += 1

        # ==========================================
        # TEST 2: Postal code auto-formatting
        # ==========================================
        print("\n[TEST 2] Postal code auto-formatting")

        try:
            postal_code = page.locator('#billingPostalCode')
            postal_code.wait_for(timeout=5000)
            postal_code.fill('')
            postal_code.type('t2p1a1', delay=50)
            postal_value = postal_code.input_value()
            print(f"  Postal value after typing: '{postal_value}'")

            if postal_value == 'T2P 1A1':
                print("  [PASS] Postal code formatted correctly as T2P 1A1")
                tests_passed += 1
            else:
                print(f"  [FAIL] Expected 'T2P 1A1', got '{postal_value}'")
                tests_failed += 1
        except Exception as e:
            print(f"  [FAIL] Error: {e}")
            tests_failed += 1

        # ==========================================
        # TEST 3: Postal code uppercase conversion
        # ==========================================
        print("\n[TEST 3] Postal code uppercase conversion")

        try:
            postal_code = page.locator('#billingPostalCode')
            postal_code.fill('')
            postal_code.type('a1b2c3', delay=50)
            postal_value = postal_code.input_value()

            if postal_value == 'A1B 2C3':
                print("  [PASS] Postal code converted to uppercase")
                tests_passed += 1
            else:
                print(f"  [FAIL] Expected 'A1B 2C3', got '{postal_value}'")
                tests_failed += 1
        except Exception as e:
            print(f"  [FAIL] Error: {e}")
            tests_failed += 1

        # Fill remaining required fields and go to step 3
        try:
            page.locator('#billingContactName').fill('John Doe')
            page.locator('#billingEmail').fill('john@example.com')
            page.locator('#billingAddress').fill('123 Main St')
            page.locator('#billingCity').fill('Calgary')
            page.locator('#billingProvince').select_option('AB')
            page.locator('#billingPostalCode').fill('')
            page.locator('#billingPostalCode').type('t2p1a1', delay=30)

            # Go to step 3
            next_btn = page.get_by_role('button', name='Next', exact=True)
            next_btn.click()
            page.wait_for_timeout(1000)
            print("\n  Proceeded to Step 3 (Event Contact)")
        except Exception as e:
            print(f"  Note: Could not proceed to step 3: {e}")

        # ==========================================
        # TEST 4: Event contact phone formatting
        # ==========================================
        print("\n[TEST 4] Event contact phone auto-formatting")

        try:
            page.screenshot(path='/tmp/osa-step3.png', full_page=True)

            event_phone = page.locator('#eventContactPhone')
            event_phone.wait_for(timeout=5000)
            event_phone.fill('')
            event_phone.type('7801234567', delay=50)
            event_phone_value = event_phone.input_value()

            if event_phone_value == '(780) 123-4567':
                print("  [PASS] Event contact phone formatted correctly")
                tests_passed += 1
            else:
                print(f"  [FAIL] Expected '(780) 123-4567', got '{event_phone_value}'")
                tests_failed += 1
        except Exception as e:
            print(f"  [FAIL] Error: {e}")
            tests_failed += 1

        # ==========================================
        # SUMMARY
        # ==========================================
        print("\n" + "=" * 60)
        print(f"RESULTS: {tests_passed} passed, {tests_failed} failed")
        print("=" * 60)

        page.screenshot(path='/tmp/osa-form-test-final.png', full_page=True)
        print("\nFinal screenshot saved to /tmp/osa-form-test-final.png")

        browser.close()

        return tests_failed == 0

if __name__ == '__main__':
    success = test_osa_form()
    sys.exit(0 if success else 1)
