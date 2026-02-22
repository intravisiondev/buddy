# Buddy Mobile App

React Native + Expo mobil uygulaması - iOS ve Android için.

## Özellikler

- ✅ Expo Router ile file-based navigation
- ✅ NativeWind (Tailwind CSS) ile styling
- ✅ TypeScript
- ✅ Dark mode desteği
- ✅ Multi-role support (Student, Teacher, Parent)
- ✅ Authentication (Login/Signup)
- ✅ Dashboard'lar (Student, Teacher, Parent)
- ✅ Study Rooms
- ✅ Study Plans
- ✅ Leaderboard
- ✅ Settings

## Teknoloji Stack

- **Framework**: React Native + Expo SDK 50+
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: React Context API
- **API**: Fetch API ile HTTP istekleri
- **Icons**: Lucide React
- **Storage**: AsyncStorage

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Development server'ı başlat
npm start

# iOS simulator'da çalıştır
npm run ios

# Android emulator'da çalıştır
npm run android
```

## Proje Yapısı

```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth screens (login, signup)
│   ├── (tabs)/            # Student tab navigation
│   ├── (teacher)/         # Teacher screens
│   ├── (parent)/          # Parent screens
│   ├── room/[id].tsx      # Room detail
│   ├── study-plan/[id].tsx # Study plan detail
│   ├── onboarding.tsx     # Role selection
│   ├── settings.tsx       # Settings
│   └── _layout.tsx        # Root layout
├── components/
│   └── ui/                # UI components
├── contexts/              # React contexts
├── services/              # API services
├── hooks/                 # Custom hooks
├── utils/                 # Utilities
├── constants/             # Constants (theme, etc.)
└── assets/                # Images, fonts
```

## Environment Variables

`.env` dosyası:
```
EXPO_PUBLIC_API_URL=http://localhost:8080
```

## API Integration

Backend API: `http://localhost:8080` (development)

Tüm API istekleri JWT token ile authenticate edilir.

## Geliştirme

### Hot Reload

Expo development server otomatik olarak değişiklikleri algılar ve uygulamayı yeniden yükler.

### Debugging

- React Native Debugger kullanabilirsiniz
- Chrome DevTools ile debug edebilirsiniz
- Expo Go app ile fiziksel cihazda test edebilirsiniz

## Build

### Development Build

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build

```bash
eas build --profile production --platform all
```

## Notlar

- NativeWind v4 kullanıldığı için Tailwind class'ları doğrudan kullanılabilir
- Dark mode otomatik olarak sistem temasını takip eder
- AsyncStorage kullanıldığı için offline data persistence desteklenir
- Expo Router kullanıldığı için deep linking otomatik olarak çalışır

## Sorun Giderme

### Metro Bundler başlamıyorsa

```bash
npm start -- --clear
```

### iOS simulator açılmıyorsa

```bash
npx expo run:ios
```

### Android emulator açılmıyorsa

```bash
npx expo run:android
```

## Lisans

MIT
