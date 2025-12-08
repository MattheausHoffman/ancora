import { Component, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';

import { Navbar } from "./components/navbar/navbar";
import { Footer } from "./components/footer/footer";


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ancora');

  // rotas em que o footer NÃO deve aparecer
  showFooter = true;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // pega a rota mais interna ativa
        let child = this.route.firstChild;
        while (child?.firstChild) {
          child = child.firstChild;
        }

        const hideFooter = child?.snapshot.data['hideFooter'] === true;
        this.showFooter = !hideFooter;
      }
    });
  }
}
