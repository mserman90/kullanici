

# Sherlock Benzeri Kullanıcı Adı Arama Uygulaması

Sosyal medya platformlarında kullanıcı adı araması yapan bir React web uygulaması oluşturulacak.

## Yapılacaklar

1. **Arama sayfası oluştur** - Kullanıcı adı giriş alanı, arama butonu ve sonuç listesi içeren ana sayfa
2. **Platform veritabanı oluştur** - ~50 popüler platformun (GitHub, Twitter, Instagram, Reddit vb.) URL şablonlarını içeren statik veri dosyası
3. **Arama mantığı** - Her platforma HTTP isteği atarak kullanıcı adının var olup olmadığını kontrol eden servis (fetch ile, CORS sınırlamaları nedeniyle bazı platformlar simüle edilecek)
4. **Sonuç kartları** - Her platform için bulundu/bulunamadı durumunu gösteren kartlar, animasyonlu ilerleme çubuğu
5. **Sonuç dışa aktarma** - JSON/CSV olarak indirme

## Teknik Detaylar

- `src/data/platforms.ts` - Platform listesi (isim, URL şablonu, ikon)
- `src/pages/Index.tsx` - Ana arama arayüzü
- `src/components/SearchBar.tsx` - Arama bileşeni
- `src/components/PlatformResult.tsx` - Tekil sonuç kartı
- `src/components/ResultsList.tsx` - Sonuç listesi
- `src/hooks/useSearch.ts` - Arama mantığı hook'u
- `src/utils/export.ts` - CSV/JSON dışa aktarma

Koyu temalı, terminal/hacker estetiğinde bir tasarım kullanılacak (yeşil vurgular, koyu arka plan). Gerçek API çağrıları CORS nedeniyle sınırlı olacağından, çoğu platform için simüle edilmiş sonuçlar döndürülecek.

