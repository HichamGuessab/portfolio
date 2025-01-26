export interface Skill {
  name: string;
  image: Image;
  type: SkillType;
}

export enum SkillType {
  Default = 'default',
  Shiny = 'shiny',
}

export interface Project {
  name: string;
  description: string;
  technologies: Image[];
  url: string;
}

export interface Degree {
  name: string;
  type: string;
  institution: string;
  date: string;
}

export enum Section {
  Profile = 'profile',
  Projects = 'projects',
  Skills = 'skills',
  Education = 'education',
}

export type Image = BlueImage | ShinyImage | WhiteImage;

export enum BlueImage {
  About = 'assets/images/blue-about.png',
  At = 'assets/images/blue-at.png',
  Directory = 'assets/images/blue-directory.png',
  Github = 'assets/images/blue-github.png',
  Identity = 'assets/images/blue-identity.png',
  Linkedin = 'assets/images/blue-linkedin.png',
  Stack = 'assets/images/blue-stack.png',
  Study = 'assets/images/blue-study.png',
  Technology = 'assets/images/blue-technology.png',
  Work = 'assets/images/blue-work.png',
}

export enum ShinyImage {
  Angular = 'assets/images/shiny-angular.png',
  Figma = 'assets/images/shiny-figma.png',
  Tailwind = 'assets/images/shiny-tailwind.png',
  Typescript = 'assets/images/shiny-typescript.png',
}

export enum WhiteImage {
  Angular = 'assets/images/white-angular.png',
  Arduino = 'assets/images/white-arduino.png',
  Bash = 'assets/images/white-bash.png',
  Cpp = 'assets/images/white-cpp.png',
  Docker = 'assets/images/white-docker.png',
  Express = 'assets/images/white-express.png',
  Figma = 'assets/images/white-figma.png',
  Flutter = 'assets/images/white-flutter.png',
  Git = 'assets/images/white-git.png',
  GithubMascot = 'assets/images/white-github-mascot.png',
  Gitlab = 'assets/images/white-gitlab.png',
  Ice = 'assets/images/white-ice.png',
  Ionic = 'assets/images/white-ionic.png',
  Java = 'assets/images/white-java.png',
  Mongodb = 'assets/images/white-mongodb.png',
  Nodejs = 'assets/images/white-nodejs.png',
  Npm = 'assets/images/white-npm.png',
  Pgsql = 'assets/images/white-pgsql.png',
  Python = 'assets/images/white-python.png',
  Raspberry = 'assets/images/white-raspberry-pi.png',
  Redux = 'assets/images/white-redux.png',
  ReactNative = 'assets/images/white-reactNative.png',
  Sql = 'assets/images/white-sql.png',
  Tailwind = 'assets/images/white-tailwind.png',
  Typescript = 'assets/images/white-typescript.png',
  XML = 'assets/images/white-xml.png',
}

export enum Link {
  Email = 'mailto:hichamgsb.pro@gmail.com',
  LinkedIn = 'https://www.linkedin.com/in/hicham-g-811573222/',
  Github = 'https://github.com/HichamGuessab',
}
