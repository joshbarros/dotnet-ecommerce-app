import { Component } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter, RouterOutlet } from "@angular/router";
import { ProductsPage } from "./app/products/products.page";
@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  template: "<router-outlet />",
})
class App {}
bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter([
      { path: "", pathMatch: "full", redirectTo: "products" },
      { path: "products", component: ProductsPage },
      { path: "**", redirectTo: "products" },
    ]),
  ],
}).catch(console.error);
