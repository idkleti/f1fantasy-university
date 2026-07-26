// CONVERSAZIONE 4: le mie scommesse
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BetService } from '../../servizi/bet.service';
import { Bet } from '../../modelli/bet.model';

@Component({
  selector: 'app-lista-scommesse',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lista-scommesse.component.html'
})

export class ListaScommesseComponent implements OnInit {
  scommesse: Bet[] = [];
  errore = '';

  constructor(private betService: BetService) {}

  ngOnInit(): void {
    this.betService.myBets().subscribe({
      next: b => this.scommesse = b,
      error: err => this.errore = err.error?.erroreMsg || 'Impossibile caricare le scommesse'
    });
  }
}
