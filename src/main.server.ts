import {
  BootstrapContext,
  bootstrapApplication,
} from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

/* Point d'entrée du pré-rendu statique (outputMode « static ») : la page est
   rendue en HTML au build, puis hydratée dans le navigateur. */
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;
