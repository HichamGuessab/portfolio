import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Image } from '../../interfaces';

@Component({
  selector: 'section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="mb-12 flex gap-5 place-self-center">
      <img [src]="icon()" alt="" class="h-14 w-14 place-self-center" />
      <h2
        class="content-center bg-gradient-to-r from-lightBlue to-purple bg-clip-text font-analogue text-5xl font-regular text-transparent"
      >
        {{ title() }}
      </h2>
    </div>
  `,
})
export class SectionHeaderComponent {
  icon = input.required<Image>();
  title = input.required<string>();
}
