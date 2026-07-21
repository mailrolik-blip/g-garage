import { PrismaClient } from "@prisma/client";
import { normalizeArticle, normalizeBrand, slugify } from "../src/lib/normalize.js";

const prisma = new PrismaClient();

const categorySeed = ["Двигатель", "Тормозная система", "Подвеска", "Масла и жидкости", "Фильтры", "Электрика", "Кузов и свет", "Расходники ТО"];
const brandSeed = ["BOSCH", "MANN", "BREMBO", "NGK", "SACHS", "DENSO", "TRW", "SHELL"];
const names = [
  ["SHELL", "Моторное масло Helix Ultra 5W-30 4 л", "Масла и жидкости"],
  ["BREMBO", "Диск тормозной передний вентилируемый", "Тормозная система"],
  ["NGK", "Свеча зажигания иридиевая", "Двигатель"],
  ["MANN", "Фильтр воздушный двигателя", "Фильтры"],
  ["SACHS", "Амортизатор передний газовый", "Подвеска"],
  ["BOSCH", "Датчик кислорода универсальный", "Электрика"],
  ["TRW", "Колодки тормозные передние", "Тормозная система"],
  ["DENSO", "Катушка зажигания", "Электрика"],
];

async function main() {
  const categories = new Map<string, string>();
  for (const [sortOrder, name] of categorySeed.entries()) {
    const c = await prisma.category.upsert({ where: { slug: slugify(name) }, update: { name, sortOrder }, create: { name, slug: slugify(name), sortOrder } });
    categories.set(name, c.id);
  }
  const brands = new Map<string, string>();
  for (const name of brandSeed) {
    const normalizedName = normalizeBrand(name).normalizedName;
    const b = await prisma.brand.upsert({ where: { normalizedName }, update: { name, slug: slugify(name) }, create: { name, normalizedName, slug: slugify(name) } });
    brands.set(name, b.id);
  }
  const supplier = await prisma.supplier.upsert({ where: { code: "DEV" }, update: { name: "Dev Supplier" }, create: { name: "Dev Supplier", code: "DEV" } });
  const wh1 = await prisma.warehouse.upsert({ where: { supplierId_code: { supplierId: supplier.id, code: "MSK" } }, update: {}, create: { supplierId: supplier.id, code: "MSK", name: "Москва", city: "Москва" } });
  const wh2 = await prisma.warehouse.upsert({ where: { supplierId_code: { supplierId: supplier.id, code: "SPB" } }, update: {}, create: { supplierId: supplier.id, code: "SPB", name: "Санкт-Петербург", city: "Санкт-Петербург" } });
  for (let i = 0; i < 24; i++) {
    const seed = names[i % names.length];
    const article = `${seed[0]}-${2200 + i * 17}`;
    const normalizedArticle = normalizeArticle(article).normalizedArticle;
    const brandId = brands.get(seed[0])!;
    const product = await prisma.product.upsert({
      where: { brandId_normalizedArticle: { brandId, normalizedArticle } },
      update: { name: seed[1], categoryId: categories.get(seed[2]), qualityLevel: ["original", "trusted", "budget"][i % 3] },
      create: { sku: `DEV-${String(i + 1).padStart(3, "0")}`, article, normalizedArticle, name: seed[1], slug: slugify(`${seed[0]}-${article}-${seed[1]}`), brandId, categoryId: categories.get(seed[2]), unit: "шт", qualityLevel: ["original", "trusted", "budget"][i % 3], imagePath: `/storefront/assets/products/${["oil-shell-helix.png", "brake-discs-brembo.png", "spark-plugs-ngk.png", "air-filter-mann.png", "shock-absorber-sachs.png"][i % 5]}` },
    });
    const warehouse = i % 2 ? wh1 : wh2;
    await prisma.supplierOffer.upsert({
      where: { supplierId_warehouseId_supplierArticle: { supplierId: supplier.id, warehouseId: warehouse.id, supplierArticle: article } },
      update: { retailPrice: 900 + i * 310, purchasePrice: 700 + i * 260, stockQuantity: i % 7 === 0 ? 0 : 3 + i, deliveryDaysMin: i % 3, deliveryDaysMax: i % 3 + 2 },
      create: { productId: product.id, supplierId: supplier.id, warehouseId: warehouse.id, supplierArticle: article, retailPrice: 900 + i * 310, purchasePrice: 700 + i * 260, currency: "RUB", stockQuantity: i % 7 === 0 ? 0 : 3 + i, minimumOrderQuantity: 1, deliveryDaysMin: i % 3, deliveryDaysMax: i % 3 + 2, sourceUpdatedAt: new Date() },
    });
  }
}

main().finally(async () => prisma.$disconnect());
