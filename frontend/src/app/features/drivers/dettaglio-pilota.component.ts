// CONVERSAZIONE 2: dettaglio pilota con risultati gara per gara

// numero pilota arriva dal parametro di rotta :numero.
// La foto si trova in assets/piloti, se manca si ricade su un segnaposto disegnato nei colori della scuderia.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router'; // ActivatedRoute per leggere parametri rotta
import { DriverService } from '../../servizi/driver.service';
import { DriverDetail } from '../../modelli/driver.model';
import { coloreScuderia, logoScuderia } from '../../modelli/scuderie';

@Component({
  selector: 'app-dettaglio-pilota',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dettaglio-pilota.component.html'
})

export class DettaglioPilotaComponent implements OnInit {
  pilota: DriverDetail | null = null;
  errore = '';
  // falso se piltoa non ha foto disponibile
  fotoDisponibile = true;

  constructor(private route: ActivatedRoute, private driverService: DriverService) {}

  ngOnInit(): void {
    const numero = Number(this.route.snapshot.paramMap.get('numero'));
    this.driverService.get(numero).subscribe({
      next: p => this.pilota = p,
      error: err => this.errore = err.error?.erroreMsg || 'Pilota non trovato'
    });
  }

  // nei controlli uso pilota?. perchè i dati potrebbero non ancora essere arrivati
  coloreScuderia(): string {
    return coloreScuderia(this.pilota?.scuderia_corrente);
  }

  /** Logo della scuderia (stringa vuota se non mappata). */
  logoScuderia(): string {
    return logoScuderia(this.pilota?.scuderia_corrente);
  }

  /** Sfondo della foto sfumato nel colore della scuderia (hex + alfa). */
  sfondoFoto(): string {
    const c = this.coloreScuderia();
    return `linear-gradient(180deg, ${c}2E, ${c}0A)`;
  }

  /** Percorso della foto: dal cognome, in minuscolo e senza accenti. */
  fotoPilota(): string {
    const file = (this.pilota?.cognome || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')   // NFD: spezza lettere non unicode in lettera unicode + simbolo, toglie gli accenti
      .replace(/[^a-z]/g, ''); // tengo solo lettere a-z
    return `assets/piloti/${file}.webp`;
  }
}
