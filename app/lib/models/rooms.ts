export type Room = {
    id: string;
  
    name: string;
  
    floor: number;
  
    category: 1 | 2 | 3;
  
    class: 1 | 2 | 3 | 4;
  
    affected: boolean;
  
    walls: string[];
  
    photos: string[];
  };