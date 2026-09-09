import Image from "next/image";
export function UniversityLogo({university}:{university:{id:string;name:string}}){return <div className={`university-logo-frame${["uct","cput","vut"].includes(university.id)?" university-logo-dark":""}`}><Image src={`/universities/${university.id}.png`} alt={`${university.name} official logo`} width={240} height={100} style={{objectFit:"contain"}}/></div>}
