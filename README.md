# Closet Chic

Aplicación Ionic/Angular para registrar clientes y pedidos de TEMU, SHEIN, Amazon u otras tiendas. Permite controlar pagos, entregas, filtros por fecha y un dashboard de pedidos por día. La persistencia móvil usa SQLite mediante Capacitor.

## Requisitos

- Git
- Node.js 20 o superior
- npm
- Android Studio instalado
- Android SDK instalado desde Android Studio
- Java JDK compatible con Android Gradle Plugin

En Windows, asegúrate de que `node`, `npm` y `git` estén disponibles en el `PATH`.

## Clonar e instalar

```bash
git clone <URL_DEL_REPOSITORIO>
cd closetApp
npm install
```

Si quieres confirmar que todo quedó instalado:

```bash
node --version
npm --version
npx ionic --version
```

## Ejecutar en navegador

```bash
npm start
```

Luego abre:

```text
http://localhost:4200
```

Nota: en navegador la app usa almacenamiento local como respaldo. En Android usa SQLite con Capacitor.

## Preparar Android

Genera el build web y sincroniza Capacitor:

```bash
npm run build
npx cap sync android
```

Si es la primera vez en otra computadora, abre el proyecto Android para que Android Studio descargue Gradle y dependencias:

```bash
npx cap open android
```

## Ejecutar en Android Studio

1. Ejecuta:

   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. En Android Studio espera a que termine el sync de Gradle.
3. Selecciona un emulador o un teléfono conectado.
4. Presiona `Run`.

## Generar APK con Android Studio

1. Ejecuta:

   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. En Android Studio selecciona:

   ```text
   Build > Build Bundle(s) / APK(s) > Build APK(s)
   ```

3. El APK debug queda normalmente en:

   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

## Generar APK solo por línea de comandos

Primero genera y sincroniza la app:

```bash
npm run build
npx cap sync android
```

Luego entra a la carpeta Android:

```bash
cd android
```

En Windows:

```bash
.\gradlew.bat assembleDebug
```

En macOS/Linux:

```bash
./gradlew assembleDebug
```

Si sigues dentro de la carpeta `android`, el APK se genera en:

```text
app/build/outputs/apk/debug/app-debug.apk
```

Desde la raíz del repositorio, la ruta completa es:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Para volver a la raíz del proyecto:

```bash
cd ..
```

## Instalar el APK en un teléfono por ADB

Con el teléfono conectado y depuración USB activada:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Si `adb` no se reconoce, agrega al `PATH` la carpeta `platform-tools` del Android SDK.

## Comandos útiles

```bash
npm run build
npx cap sync android
npx cap open android
npx cap run android
```

## Problemas comunes

### `node` o `npm` no se reconoce

Instala Node.js y reinicia la terminal. En Windows confirma que Node esté en el `PATH`.

### Android Studio no encuentra el SDK

Abre Android Studio y revisa:

```text
Settings > Languages & Frameworks > Android SDK
```

También puedes crear o revisar `android/local.properties` con una ruta como:

```properties
sdk.dir=C\:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

### Cambios web no aparecen en Android

Cada vez que cambies la app Angular y quieras probar Android, ejecuta:

```bash
npm run build
npx cap sync android
```

### El ícono no cambia al reinstalar

Desinstala la app del teléfono/emulador y vuelve a instalarla. Algunos launchers guardan caché del ícono.

## Datos de la app

- Clientes: crear, editar, eliminar y listar.
- Pedidos: crear, editar, eliminar, marcar como pagado y entregado.
- Dashboard: resumen de pedidos por día.
- Fechas visibles en formato `dd-mm-yyyy`.
- Persistencia: SQLite en Android mediante `@capacitor-community/sqlite`.
