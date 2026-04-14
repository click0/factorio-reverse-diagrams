# ТЗ: Фаза 11 — Cheat Sheet діаграми

## Контекст

Порівняння з [factoriocheatsheet.com](https://factoriocheatsheet.com) виявило 11 тем, які є на cheat sheet, але відсутні в нашому проєкті. Ці діаграми — практичні калькулятори та таблиці, які гравці шукають найчастіше.

**Гілка:** створити `phase11/cheat-sheet`
**Базова версія:** v0.44 (`phase10/biter-ai`)

---

## 1. Common Ratios (Типові співвідношення)

**Що:** Інтерактивна таблиця найбільш використовуваних виробничих співвідношень.

**Дані:**
- Green circuit: 3 assembler-2 + 2 copper cable assembler-2
- Red circuit: 6:1:8 (assembler-3 : copper cable : green circuit)
- Blue circuit: 20 green + 2 red + sulfuric acid
- Steel: 5 stone furnace per 1 steel furnace
- Rocket fuel: solid fuel → rocket fuel
- Science packs: типові блоки на 1/min кожного пакета

**Інтерактивність:**
- Кількість assembler вибрати → показати потрібну кількість вхідних машин
- Перемикач assembler tier (1/2/3/EM Plant)
- Модулі продуктивності toggle → перерахунок

**i18n:** EN + UK

---

## 2. Oil Refining (Нафтопереробка)

**Що:** Схема нафтопереробки з балансом рідин.

**Дані:**
- Basic oil processing: 100 crude → 45 petroleum
- Advanced oil processing: 100 crude + 50 water → 25 heavy + 45 light + 55 petroleum
- Heavy oil cracking: 40 heavy + 30 water → 30 light
- Light oil cracking: 30 light + 30 water → 20 petroleum
- Coal liquefaction: 10 coal + 25 heavy + 50 steam → 90 heavy + 20 light + 10 petroleum

**Інтерактивність:**
- SVG flow діаграма з потоками рідин (товщина = throughput)
- Вибір режиму: Basic / Advanced / Coal Liquefaction
- Слайдер цільового petroleum output → розрахунок потрібних рафінерій та крекінг-установок
- Баланс heavy/light/petroleum показаний числами

**i18n:** EN + UK

---

## 3. Cargo Wagon Transfer (Пропускна здатність вантажних вагонів)

**Що:** Таблиця throughput завантаження/розвантаження вагона різними інсертерами.

**Дані:**
- Вагон: 40 слотів
- Inserter throughput per type: burner, basic, long, fast, stack, bulk
- Кількість інсертерів на сторону вагона: 6
- Items/second для кожної комбінації (інсертер × кількість × stack bonus)
- Час повного завантаження/розвантаження

**Інтерактивність:**
- Вибір типу інсертера
- Вибір кількості інсертерів (1-12, обидві сторони)
- Stack bonus research level (0-7)
- Результат: items/sec, час повного завантаження

**i18n:** EN + UK

---

## 4. Fluid Wagon Transfer (Пропускна здатність цистерн)

**Що:** Throughput рідинних вагонів з насосами.

**Дані:**
- Fluid wagon: 25,000 одиниць рідини
- Pump throughput: 12,000/sec
- 3 з'єднання на вагон
- Час заповнення з 1/2/3 насосами
- Порівняння: pipes vs fluid wagon на різних відстанях

**Інтерактивність:**
- Кількість насосів (1-3)
- Відстань (для порівняння з трубами)
- Тип рідини (crude oil, water, sulfuric acid — різна в'язкість не впливає у 2.0)

**i18n:** EN + UK

---

## 5. Balancers (Балансери конвеєрів)

**Що:** Візуальні схеми типових балансерів.

**Дані:**
- 1-to-2, 2-to-2, 4-to-4, 6-to-6, 8-to-8
- Input/output балансування (throughput-unlimited vs throughput-limited)
- Lane balancers
- Priority splitters

**Інтерактивність:**
- Вибір конфігурації (NxN)
- SVG рендер схеми з підписами
- Анімація потоку предметів (опціонально)

**i18n:** EN + UK

---

## 6. Inserter Capacity Bonus (Бонус ємності інсертера)

**Що:** Таблиця ємності інсертерів по рівням дослідження.

**Дані:**
- Stack inserter base: 1 → з дослідженнями до 12
- Bulk inserter (SA): до 16
- Кожен рівень дослідження: вартість, бонус
- Таблиця: рівень × тип інсертера → stack size

**Інтерактивність:**
- Слайдер рівня дослідження (1-7)
- Таблиця оновлюється в реальному часі
- Порівняння throughput до/після

**i18n:** EN + UK

---

## 7. Material Processing (Обробка матеріалів)

**Що:** Часи плавки та обробки ресурсів.

**Дані:**
- Iron ore → iron plate: 3.2s
- Copper ore → copper plate: 3.2s
- Iron plate → steel plate: 16s (5 iron plates)
- Stone → stone brick: 3.2s
- Furnace types: stone (1x), steel (2x), electric (2x), foundry (4x + 50% prod)

**Інтерактивність:**
- Вибір печі → показати ефективний час
- Кількість печей → items/min output
- Порівняння типів печей

**i18n:** EN + UK

---

## 8. Power Steam (Паровий калькулятор)

**Що:** Співвідношення бойлерів і парових двигунів.

**Дані:**
- 1 offshore pump → 20 boilers → 40 steam engines = 36MW
- Boiler: 1.8MW consumption, 1.8MW steam output
- Steam engine: 900kW output
- Ratio: 1:20:40

**Інтерактивність:**
- Слайдер цільової потужності (MW)
- Автоматичний розрахунок кількості: pumps, boilers, engines
- Порівняння зі solar (з power-calculator)

**i18n:** EN + UK

---

## 9. Productivity Module Payoffs (Окупність модулів продуктивності)

**Що:** Калькулятор ROI модулів продуктивності.

**Дані:**
- Prod Module 1: +4% prod, -5% speed, вартість виробництва
- Prod Module 2: +6% prod, -10% speed
- Prod Module 3: +10% prod, -15% speed
- Формула: crafts_to_payoff = module_cost / (prod_bonus × recipe_cost)

**Інтерактивність:**
- Вибір модуля (1/2/3)
- Вибір рецепту (green circuit, red circuit, blue circuit, rocket part, etc.)
- Результат: кількість крафтів до окупності, час до окупності

**i18n:** EN + UK

---

## 10. Train Colors (Кольори поїздів)

**Що:** Палітра кольорових схем для маркування поїздів по маршрутах.

**Дані:**
- Типові кольори: залізо (сірий), мідь (оранжевий), вугілля (чорний), нафта (синій), зелені схеми (зелений)
- RGB/hex значення
- Factorio color format (0-1 float)

**Інтерактивність:**
- Превью кольору поїзда (SVG локомотив)
- Можливість обрати ресурс → показати рекомендований колір
- Color picker для кастомних кольорів

**i18n:** EN + UK

---

## 11. Vehicle Fuel Bonus (Бонус палива для транспорту)

**Що:** Таблиця бонусів швидкості та прискорення від типу палива.

**Дані:**
- Wood: 0% bonus
- Coal: 0% bonus
- Solid fuel: +20% top speed, +20% acceleration
- Rocket fuel: +80% top speed, +80% acceleration
- Nuclear fuel: +150% top speed, +150% acceleration
- Порівняння для: car, tank, locomotive, spidertron

**Інтерактивність:**
- Вибір транспорту
- Вибір палива
- Результат: ефективна швидкість, прискорення, витрата палива/хв

**i18n:** EN + UK

---

## Загальні вимоги

- Кожен віджет — окремий lazy-loaded компонент
- Реєстрація в DiagramPage, EmbedPage, Sidebar, Home
- Повний EN + UK переклад
- Canvas або SVG відповідно до типу візуалізації
- Responsive (desktop + mobile)
- Embed mode через `/#/embed/:widgetId`
- CHANGELOG.md оновити
- Версію бампнути: v0.45.0

## Орієнтовна структура файлів

```
src/widgets/
├── common-ratios/CommonRatios.tsx
├── oil-refining/OilRefining.tsx
├── cargo-wagon/CargoWagon.tsx
├── fluid-wagon/FluidWagon.tsx
├── balancers/Balancers.tsx
├── inserter-capacity/InserterCapacity.tsx
├── material-processing/MaterialProcessing.tsx
├── power-steam/PowerSteam.tsx
├── prod-module-payoff/ProdModulePayoff.tsx
├── train-colors/TrainColors.tsx
└── vehicle-fuel/VehicleFuel.tsx
```

## Пріоритет реалізації

1. **Common Ratios** — найбільш шуканий контент
2. **Oil Refining** — складна тема, яку часто гуглять
3. **Power Steam** — базовий калькулятор для новачків
4. **Cargo Wagon Transfer** + **Fluid Wagon Transfer** — пара
5. **Material Processing** — простий, швидкий
6. **Prod Module Payoffs** — ROI калькулятор
7. **Balancers** — візуальні схеми
8. **Inserter Capacity Bonus** — таблиця
9. **Vehicle Fuel Bonus** — таблиця
10. **Train Colors** — косметичний
