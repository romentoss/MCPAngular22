import { Routes } from '@angular/router';
import { JournalComponent } from './components/journal/journal.component';
import { ChatComponent } from './components/chat/chat.component';

export const routes: Routes = [
  { path: '', component: ChatComponent },
  { path: 'journal', component: JournalComponent },
];
