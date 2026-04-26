import { expect, test } from "@playwright/test";

test.describe("Kalkulaatorite smoke testid", () => {
  test("EV laadimine: 30kWh, 11kW, 0,16 €/kWh", async ({ page }) => {
    await page.goto("/kalkulaatorid/ev-laadimine");

    await page.getByLabel("Laaditav energia (kWh)").fill("30");
    await page.getByLabel("Laadija võimsus (kW)").fill("11");
    await page.getByLabel("Elektrihind (€/kWh)").fill("0,16");
    await page.getByLabel("Peakaitse (A)").fill("32");
    await page.getByLabel("Muud koormused majas (reserv, kW)").fill("2");
    await page.getByLabel("Süsteem").selectOption("3");
    await page.getByRole("button", { name: "Arvuta tulemus" }).click();

    await expect(page.getByText("2h 44m").first()).toBeVisible();
    await expect(page.getByText("4,80")).toBeVisible();

    const fits11Card = page.locator(".metric-card", { hasText: "Kas 11 kW sobib" });
    await expect(fits11Card).toContainText("Jah");
  });

  test("Peak shaving: 120/90/150/60/2/6,5", async ({ page }) => {
    await page.goto("/kalkulaatorid/peak-shaving");

    await page.getByLabel("Olemasolev tipukoormus (kW)").fill("120");
    await page.getByLabel("Soovitud piir (kW)").fill("90");
    await page.getByLabel("Aku suurus (kWh)").fill("150");
    await page.getByLabel("Aku võimsus (kW)").fill("60");
    await page.getByLabel("Tiputunni kestus (h)").fill("2");
    await page.getByLabel("Võimsustasu (€/kW/kuu)").fill("6,5");
    await page.getByRole("button", { name: "Arvuta tulemus" }).click();

    const requiredCard = page
      .locator(".metric-card")
      .filter({ has: page.locator(".metric-label", { hasText: "Vajalik lõige" }) });
    await expect(requiredCard).toContainText("30,0");

    const achievableCard = page
      .locator(".metric-card")
      .filter({ has: page.locator(".metric-label", { hasText: "Saavutatav lõige" }) });
    await expect(achievableCard).toContainText("30,0");

    const yearlySavingCard = page
      .locator(".metric-card")
      .filter({ has: page.locator(".metric-label", { hasText: "Olulisim: hinnanguline sääst aastas" }) });
    await expect(yearlySavingCard).toContainText(/2 ?340/);
  });

  test("VPP: netotulu ei ole null ja ~8721 €/a", async ({ page }) => {
    await page.goto("/kalkulaatorid/vpp");

    await page.getByLabel("Aku maht (kWh)").fill("100");
    await page.getByLabel("Aku võimsus (kW)").fill("50");
    await page.getByLabel("Investeering (€)").fill("60000");
    await page.getByLabel("Aastane tulupotentsiaal (€)").fill("12000");
    await page.getByLabel("Eluiga (a)").selectOption("10");

    // Vaike-eeldused: efektiivsus 90%, kättesaadavus 95%, riskikorrektuur 15% (riskikoefitsient 85%).
    await page.getByRole("button", { name: "Arvuta tulemus" }).click();

    const netIncomeCard = page.locator(".metric-card", { hasText: "Olulisim: aastane netotulu (baas)" });
    await expect(netIncomeCard).toBeVisible();
    await expect(netIncomeCard).not.toContainText("0EUR/a");
    await expect(netIncomeCard).toContainText(/8 ?721/);
  });

  test("Päikesejaam PVGIS voog: tulemus kuvatakse ja tootlusallikas on määratud", async ({ page }) => {
    await page.route("**/api/pvgis**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          source: "live",
          message: "PVGIS tootlusandmed uuendatud.",
          annualProductionKwh: 10850,
          specificYieldKwhPerKw: 1085,
          monthlyProductionKwh: [
            { month: 1, productionKwh: 320 },
            { month: 2, productionKwh: 510 },
            { month: 3, productionKwh: 860 },
            { month: 4, productionKwh: 1050 },
            { month: 5, productionKwh: 1230 },
            { month: 6, productionKwh: 1330 },
            { month: 7, productionKwh: 1290 },
            { month: 8, productionKwh: 1130 },
            { month: 9, productionKwh: 890 },
            { month: 10, productionKwh: 630 },
            { month: 11, productionKwh: 390 },
            { month: 12, productionKwh: 220 },
          ],
        }),
      });
    });

    await page.goto("/kalkulaatorid/paikesejaam");

    await page.getByLabel("Päikesepargi võimsus (kW)").fill("10");
    await page.getByLabel("Aastane elektritarbimine (kWh)").fill("9000");
    await page.getByLabel("Elektri ostuhind (€/kWh)").first().fill("0,12");
    await page.getByRole("button", { name: "Täpsem arvutus" }).click();
    await page.getByLabel("Asukoha valik").selectOption("tallinn");
    await page.getByLabel("Paneelide kalle kraadides").fill("35");
    await page.getByPlaceholder("nt 0 lõuna").fill("0");

    await page.getByRole("button", { name: "Arvuta tulemus" }).click();

    await expect(
      page.locator(".metric-card").filter({ has: page.locator(".metric-label", { hasText: "Olulisim: aastane netokasu" }) }),
    ).toBeVisible();
    await expect(page.getByText("Tootlusallikas:").first()).toBeVisible();
    await expect(page.getByText(/Tootlusallikas:\s*(PVGIS|üldine Eesti eeldus)/)).toBeVisible();
  });
});

