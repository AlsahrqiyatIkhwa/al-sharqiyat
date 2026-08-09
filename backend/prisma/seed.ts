import { PrismaClient, Governorate } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Delivery is free to every governorate in Jordan — shippingFee is 0 across
// the board. estimatedDays is kept per-governorate since delivery time still
// varies by distance even though the fee doesn't.
const JORDAN_GOVERNORATES: { governorate: Governorate; shippingFee: number; estimatedDays: number }[] = [
  { governorate: 'AMMAN', shippingFee: 0, estimatedDays: 1 },
  { governorate: 'IRBID', shippingFee: 0, estimatedDays: 2 },
  { governorate: 'ZARQA', shippingFee: 0, estimatedDays: 2 },
  { governorate: 'MAFRAQ', shippingFee: 0, estimatedDays: 2 },
  { governorate: 'BALQA', shippingFee: 0, estimatedDays: 2 },
  { governorate: 'MADABA', shippingFee: 0, estimatedDays: 2 },
  { governorate: 'KARAK', shippingFee: 0, estimatedDays: 3 },
  { governorate: 'TAFILEH', shippingFee: 0, estimatedDays: 3 },
  { governorate: 'MAAN', shippingFee: 0, estimatedDays: 3 },
  { governorate: 'AQABA', shippingFee: 0, estimatedDays: 3 },
  { governorate: 'JERASH', shippingFee: 0, estimatedDays: 2 },
  { governorate: 'AJLOUN', shippingFee: 0, estimatedDays: 2 },
];

const PRODUCTS = [
  {
    slug: 'abaya-souq-aswad',
    nameAr: 'عباية سوداء مطرزة ذهبي',
    nameEn: null,
    descriptionAr: 'عباية سوداء فاخرة بتطريز ذهبي كامل يدوي، قصة كلاسيكية أنيقة.',
    category: 'عباية',
    basePrice: 50.0,
    isFeatured: true,
    images: [{ imageUrl: '/products/abaya-souq-aswad-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أسود', hex: '#0A0A0A' },
  },
  {
    slug: 'qaftan-zahret-sharq',
    nameAr: 'قفطان بنفسجي مطرز ذهبي',
    nameEn: null,
    descriptionAr: 'قفطان مغربي بنفسجي فاخر بتطريز ذهبي كثيف، إطلالة ملكية أصيلة.',
    category: 'قفطان مغربي',
    basePrice: 50.0,
    isFeatured: true,
    images: [{ imageUrl: '/products/qaftan-zahret-sharq-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'بنفسجي', hex: '#4B1E3F' },
  },
  {
    slug: 'abaya-baida-cape',
    nameAr: 'عباية بيضاء بكاب مطرز ذهبي',
    nameEn: null,
    descriptionAr: 'عباية بيضاء بتصميم كاب أنيق وتطريز ذهبي راقٍ، مناسبة للمناسبات الدينية والاحتفالات.',
    category: 'عباية',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/abaya-baida-cape-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أبيض', hex: '#F5F1E8' },
  },
  {
    slug: 'abaya-morabba-dahabi',
    nameAr: 'عباية سوداء مربعات ذهبية',
    nameEn: null,
    descriptionAr: 'عباية سوداء بنقشة مربعات ذهبية مطرزة وحزام مطرز، قصة عصرية أنيقة.',
    category: 'عباية',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/abaya-morabba-dahabi-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أسود', hex: '#0A0A0A' },
  },
  {
    slug: 'qaftan-mukhmal-almani-1',
    nameAr: 'قفطان مخمل أسود — صاروخين ألماني تطريز براتو يدوي',
    nameEn: null,
    descriptionAr: 'قفطان من قماش المخمل الألماني الفاخر (صاروخين)، تطريز براتو يدوي دقيق بخيوط ذهبية.',
    category: 'قفطان مغربي',
    basePrice: 140.0,
    isFeatured: true,
    images: [{ imageUrl: '/products/qaftan-mukhmal-almani-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أسود', hex: '#0A0A0A' },
  },
  {
    slug: 'qaftan-mukhmal-almani-2',
    nameAr: 'قفطان أسود تطريز فيروزي — صاروخين ألماني براتو يدوي',
    nameEn: null,
    descriptionAr: 'قفطان بتطريز يدوي فيروزي اللون بتقنية براتو على قماش صاروخين الألماني الفاخر.',
    category: 'قفطان مغربي',
    basePrice: 140.0,
    isFeatured: true,
    images: [{ imageUrl: '/products/qaftan-mukhmal-almani-2.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'فيروزي', hex: '#2FA6A0' },
  },
  {
    slug: 'fustan-satan-faransi',
    nameAr: 'فستان ساتان فرنسي كلاسيكي',
    nameEn: null,
    descriptionAr: 'فستان أنيق من قماش الساتان الفرنسي الكلاسيكي (كليسيكا) بتطريز وتفاصيل راقية.',
    category: 'فستان سهرة',
    basePrice: 90.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/fustan-satan-faransi-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'ليلكي', hex: '#C9A6CE' },
  },
  {
    slug: 'qaftan-abyad-dahabi',
    nameAr: 'قفطان أبيض مطرز ذهبي',
    nameEn: null,
    descriptionAr: 'قفطان أبيض بتطريز ذهبي هندسي أنيق، مناسب للمناسبات الخاصة.',
    category: 'قفطان مغربي',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/qaftan-abyad-dahabi-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أبيض', hex: '#F5F1E8' },
  },
  {
    slug: 'fustan-wardi-aswad',
    nameAr: 'فستان أسود مطرز وردي',
    nameEn: null,
    descriptionAr: 'فستان أسود بتطريز وردي فاتح مميز، إطلالة عصرية بلمسة تراثية.',
    category: 'فستان سهرة',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/fustan-wardi-aswad-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أسود وردي', hex: '#3A2230' },
  },
  {
    slug: 'qaftan-maghribi-akhdar',
    nameAr: 'قفطان مغربي أخضر يدوي',
    nameEn: null,
    descriptionAr: 'قفطان مغربي أخضر أصيل بتطريز يدوي ذهبي وحزام مربوط، صناعة يدوية فاخرة.',
    category: 'قفطان مغربي',
    basePrice: 150.0,
    isFeatured: true,
    images: [{ imageUrl: '/products/qaftan-maghribi-akhdar-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أخضر', hex: '#0F4C36' },
  },
  {
    slug: 'fustan-abyad-dahabi-1',
    nameAr: 'فستان أبيض مطرز ذهبي بخرز',
    nameEn: null,
    descriptionAr: 'فستان أبيض بتطريز ذهبي وخرز ملون على شكل خطوط طولية أنيقة.',
    category: 'فستان سهرة',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/fustan-abyad-dahabi-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أبيض', hex: '#F5F1E8' },
  },
  {
    slug: 'qaftan-maghribi-azraq',
    nameAr: 'فستان أزرق ساتان مطرز فضي',
    nameEn: null,
    descriptionAr: 'فستان مغربي بلون أزرق ساتان فاخر بتطريز فضي دقيق على كامل الفستان.',
    category: 'قفطان مغربي',
    basePrice: 90.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/qaftan-maghribi-azraq-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أزرق', hex: '#2E4A73' },
  },
  {
    slug: 'fustan-abyad-dahabi-2',
    nameAr: 'فستان أبيض ساتان مطرز ذهبي',
    nameEn: null,
    descriptionAr: 'فستان أبيض من قماش الساتان بتطريز ذهبي وأحجار كريستالية على الصدر والأكمام.',
    category: 'فستان سهرة',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/fustan-abyad-dahabi-2.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أبيض', hex: '#F5F1E8' },
  },
  {
    slug: 'fustan-ahmar-dahabi',
    nameAr: 'فستان أحمر ساتان مطرز ذهبي',
    nameEn: null,
    descriptionAr: 'فستان أحمر فاخر من الساتان بتطريز ذهبي على الصدر والأطراف، إطلالة جريئة وأنيقة.',
    category: 'فستان سهرة',
    basePrice: 70.0,
    isFeatured: true,
    images: [{ imageUrl: '/products/fustan-ahmar-dahabi-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أحمر', hex: '#7A1F2B' },
  },
  {
    slug: 'fustan-aswad-fiddi',
    nameAr: 'فستان أسود مطرز فضي بأكمام شيفون',
    nameEn: null,
    descriptionAr: 'فستان أسود بتطريز فضي لامع بنقشة نقاط، بأكمام شيفون واسعة أنيقة.',
    category: 'فستان سهرة',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/fustan-aswad-fiddi-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أسود', hex: '#0A0A0A' },
  },
  {
    slug: 'qaftan-loulou',
    nameAr: 'قفطان لولو يدوي',
    nameEn: null,
    descriptionAr: 'قفطان بيج بتطريز ذهبي يدوي متعرج على كامل القفطان، صناعة يدوية فاخرة.',
    category: 'قفطان مغربي',
    basePrice: 60.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/qaftan-loulou-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'بيج', hex: '#D9C9A3' },
  },
  {
    slug: 'fustan-breim-yadawi',
    nameAr: 'فستان بريم يدوي',
    nameEn: null,
    descriptionAr: 'فستان كريمي بتطريز بريم يدوي فاخر، تصميم أنيق للمناسبات الخاصة.',
    category: 'فستان سهرة',
    basePrice: 90.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/fustan-breim-yadawi-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'كريمي', hex: '#EFE6D8' },
  },
  {
    slug: 'thawb-falastini',
    nameAr: 'ثوب تطريز فلسطيني — بريم يدوي، صباحية عروس',
    nameEn: null,
    descriptionAr: 'ثوب أبيض بتطريز فلسطيني تراثي أصيل باللون العنابي، مناسب لصباحية العروس.',
    category: 'ثوب مطرز',
    basePrice: 90.0,
    isFeatured: true,
    images: [{ imageUrl: '/products/thawb-falastini-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أبيض عنابي', hex: '#8C2233' },
  },
  {
    slug: 'thawb-ghabani',
    nameAr: 'ثوب تطريز غباني يدوي',
    nameEn: null,
    descriptionAr: 'ثوب أبيض بتطريز غباني يدوي ذهبي دقيق على الصدر والأكمام والأطراف.',
    category: 'ثوب مطرز',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/thawb-ghabani-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أبيض', hex: '#F5F1E8' },
  },
  {
    slug: 'qaftan-maghribi-abyad',
    nameAr: 'قفطان مغربي أبيض يدوي',
    nameEn: null,
    descriptionAr: 'قفطان مغربي أبيض بتطريز ذهبي كلاسيكي وحزام مطرز، صناعة يدوية أصيلة.',
    category: 'قفطان مغربي',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/qaftan-maghribi-abyad-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أبيض', hex: '#F5F1E8' },
  },
  {
    slug: 'thawb-saaat-1',
    nameAr: 'ثوب الساعات',
    nameEn: null,
    descriptionAr: 'ثوب تراثي بنقشة الساعات المطرزة يدوياً، بتصميم عصري بلون أخضر زيتي وحزام ساتان.',
    category: 'ثوب مطرز',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/thawb-saaat-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أخضر زيتي', hex: '#5C6B3F' },
  },
  {
    slug: 'besht-maghribi',
    nameAr: 'بشت مغربي يدوي — قطعتين',
    nameEn: null,
    descriptionAr: 'بشت مغربي من قطعتين (عباءة مخملية وفستان داخلي)، تطريز ذهبي فاخر صناعة يدوية.',
    category: 'قفطان مغربي',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/besht-maghribi-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أزرق ملكي', hex: '#1A3A8F' },
  },
  {
    slug: 'thawb-saaat-2',
    nameAr: 'ثوب الساعات',
    nameEn: null,
    descriptionAr: 'ثوب تراثي بنقشة الساعات المطرزة يدوياً بخيوط فوشية على أسود، وحزام ساتان.',
    category: 'ثوب مطرز',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/thawb-saaat-2.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أسود فوشي', hex: '#8C1B4F' },
  },
  {
    slug: 'thawb-saaat-3',
    nameAr: 'ثوب الساعات',
    nameEn: null,
    descriptionAr: 'ثوب تراثي بنقشة الساعات المطرزة يدوياً بتصميم مختلف على أسود مع حزام ساتان.',
    category: 'ثوب مطرز',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/thawb-saaat-3.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أسود فوشي', hex: '#8C1B4F' },
  },
  {
    slug: 'thawb-mukhmal-tajat',
    nameAr: 'ثوب مخمل — ثلاث تاجات ألماني',
    nameEn: null,
    descriptionAr: 'ثوب من قماش المخمل الألماني الفاخر (ثلاث تاجات) بتطريز ذهبي كامل يدوي.',
    category: 'ثوب مطرز',
    basePrice: 70.0,
    isFeatured: true,
    images: [{ imageUrl: '/products/thawb-mukhmal-tajat-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أسود', hex: '#0A0A0A' },
  },
  {
    slug: 'qaftan-brato',
    nameAr: 'قفطان تطريز براتو يدوي',
    nameEn: null,
    descriptionAr: 'قفطان مخمل بتطريز براتو يدوي فاخر، يوجد تطريز داخل القفطان ومن الخلف أيضاً.',
    category: 'قفطان مغربي',
    basePrice: 130.0,
    isFeatured: true,
    images: [{ imageUrl: '/products/qaftan-brato-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'أزرق ملكي', hex: '#1A3A8F' },
  },
  {
    slug: 'thawb-satan-sharhat-1',
    nameAr: 'ثوب ساتان شرحات',
    nameEn: null,
    descriptionAr: 'ثوب بيج بتطريز أسود وذهبي على الصدر والأكمام، بحزام ساتان مربوط.',
    category: 'ثوب مطرز',
    basePrice: 50.0,
    isFeatured: false,
    images: [{ imageUrl: '/products/thawb-satan-sharhat-1.jpg', isPrimary: true, sortOrder: 0 }],
    color: { name: 'بيج', hex: '#D9C9A3' },
  },
  {
    slug: 'qaftan-maghribi-nabiti',
    nameAr: 'قفطان مغربي يدوي',
    nameEn: null,
    descriptionAr: 'قفطان مغربي من قماش الساتان اللامع بلون نبيتي، بتطريز وخرز يدوي فاخر وحزام مطرز.',
    category: 'قفطان مغربي',
    basePrice: 120.0,
    isFeatured: true,
    images: [{ imageUrl: '/products/thawb-tara-1.jpg', isPrimary: true, sortOrder: 0 }], // TODO: wrong placeholder — needs its own maroon-kaftan photo
    color: { name: 'نبيتي', hex: '#7A1B3D' },
  },
];

// Sizes offered for every product. Stock is a reasonable default the admin
// can adjust per size/color from the admin panel at any time.
const SIZES = ['S', 'M', 'L', 'XL'];

async function main() {
  console.log('🌱 Seeding database...');

  for (const zone of JORDAN_GOVERNORATES) {
    await prisma.shippingZone.upsert({
      where: { governorate: zone.governorate },
      // Update existing rows too (e.g. shippingFee changes like the move to
      // free shipping) — previously this was `{}` so re-seeding a database
      // that already had zones never applied fee changes.
      update: { shippingFee: zone.shippingFee, estimatedDays: zone.estimatedDays },
      create: zone,
    });
  }
  console.log(`✅ ${JORDAN_GOVERNORATES.length} shipping zones ready`);

  // No need to pre-seed OrderCounter rows — generateNextOrderCode() creates
  // the row for the current "YYYYMM" key on demand, atomically, on first order.
  console.log('✅ Order counter ready (created on demand per month)');

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {},
    create: { username: adminUsername, passwordHash, role: 'admin' },
  });
  console.log(`✅ Admin user ready (username: ${adminUsername})`);

  // Wipe every existing product (and its images/variants, via cascade)
  // before inserting the new catalog — this is a full replacement, not an
  // addition, per the shop owner's request.
  const deleted = await prisma.product.deleteMany({});
  console.log(`🗑️  Removed ${deleted.count} previous product(s)`);

  for (const [index, p] of PRODUCTS.entries()) {
    // Zero-padded position in the catalog (01, 02, ...) guarantees a unique,
    // short SKU prefix per product — slug-based prefixes risked collisions
    // between similarly-named products (e.g. two "fustan-abyad-dahabi-N").
    const skuBase = `SHRQ-${String(index + 1).padStart(2, '0')}`;
    const variants = SIZES.map((size, idx) => ({
      size,
      colorName: p.color.name,
      colorHex: p.color.hex,
      sku: `${skuBase}-${size}`,
      stockQuantity: 8 - idx, // slightly less stock in larger sizes by default
    }));

    await prisma.product.create({
      data: {
        slug: p.slug,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr,
        category: p.category,
        basePrice: p.basePrice,
        isFeatured: p.isFeatured,
        images: { create: p.images },
        variants: { create: variants },
      },
    });
  }
  console.log(`✅ ${PRODUCTS.length} products ready`);

  console.log('🎉 Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
