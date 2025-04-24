export interface Option {
  value: number;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  about_reviewer?: boolean;
}
