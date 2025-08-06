import 'v8-compile-cache';

import { app, nativeImage } from 'electron';
import contextMenu from 'electron-context-menu';
import path from 'path';

import { initDeeplink } from './deeplink';
import { IS_MAC_OS, IS_PRODUCTION, IS_WINDOWS } from './utils';
import { createWindow, setupCloseHandlers, setupElectronActionHandlers } from './window';
import { initDrizzle } from '@tg-search/core';
import { initConfig } from '@tg-search/common/node';
import { initLogger, useLogger } from '@unbird/logg';
import { DatabaseType } from '@tg-search/common';

initDeeplink();

contextMenu({
  showLearnSpelling: false,
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  showSelectAll: true,
  showInspectElement: !IS_PRODUCTION,
});

app.on('ready', async () => {
  if (IS_MAC_OS) {
    app.dock?.setIcon(nativeImage.createFromPath(path.resolve(__dirname, '../public/icon-electron-macos.png')));
  }

  if (IS_WINDOWS) {
    app.setAppUserModelId(app.getName());
  }

  initLogger();
  const logger = useLogger();
  const config = await initConfig();
  initDrizzle(logger, {
    ...config,
    database: {
      type: DatabaseType.PGLITE,
    },
  }, path.resolve(__dirname, '../data/drizzle.db'));

  createWindow();
  setupElectronActionHandlers();
  setupCloseHandlers();
});
