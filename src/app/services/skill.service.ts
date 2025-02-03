import { Injectable } from '@angular/core';
import { Image, ShinyImage, Skill, SkillType, WhiteImage } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class SkillService {
  getDesignSkills(): Skill[] {
    return [this.createSkill('figma', ShinyImage.Figma, SkillType.Shiny)];
  }

  getFrontEndSkills(): Skill[] {
    return [
      this.createSkill('typescript', ShinyImage.Typescript, SkillType.Shiny),
      this.createSkill('angular', ShinyImage.Angular, SkillType.Shiny),
      this.createSkill('tailwind', ShinyImage.Tailwind, SkillType.Shiny),
      this.createSkill('ionic', WhiteImage.Ionic, SkillType.Default),
      this.createSkill('redux', WhiteImage.Redux, SkillType.Default),
    ];
  }

  getBackEndSkills(): Skill[] {
    return [
      this.createSkill('java', WhiteImage.Java, SkillType.Default),
      this.createSkill('nodejs', WhiteImage.Nodejs, SkillType.Default),
      this.createSkill('express', WhiteImage.Express, SkillType.Default),
      this.createSkill('postgresql', WhiteImage.Pgsql, SkillType.Default),
    ];
  }

  getToolsSkills(): Skill[] {
    return [
      this.createSkill('git & gitlab', WhiteImage.Git, SkillType.Default),
      this.createSkill('docker', WhiteImage.Docker, SkillType.Default),
      this.createSkill('bash', WhiteImage.Bash, SkillType.Default),
      this.createSkill('npm', WhiteImage.Npm, SkillType.Default),
    ];
  }

  private createSkill(name: string, image: Image, skillType: SkillType): Skill {
    return { name, image, type: skillType };
  }
}
