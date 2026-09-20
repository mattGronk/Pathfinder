import type { CareerProfile } from "./catalogue";

// O*NET informs duties only; its US wages, credentials and outlook are not
// represented as South African evidence. Study areas below are research leads.
const additions = [
  ["architectural-draughtsperson","Architectural draughtsperson","Built environment","Create accurate technical drawings for buildings and structures.","Mathematics|Engineering Graphics and Design|Design","Architectural technology or draughting","CAD|Technical drawing|Measurement","17-3011.00"],
  ["town-planner","Town and regional planner","Built environment","Investigate land use and help communities plan future development.","Geography|Mathematics|English","Town and regional planning","Spatial analysis|Consultation|Report writing","19-3051.00"],
  ["land-surveyor","Land surveyor","Built environment","Measure land and interpret spatial information for development projects.","Mathematics|Physical Sciences|Geography","Geomatics or land surveying","Survey instruments|Spatial data|Accuracy","17-1022.00"],
  ["food-technologist","Food technologist","Science & food systems","Investigate food quality, processing and product development.","Physical Sciences|Life Sciences|Mathematics","Food science or food technology","Laboratory methods|Quality control|Documentation","19-1012.00"],
  ["bioinformatics","Bioinformatics scientist","Science & technology","Use computation to investigate biological information.","Life Sciences|Mathematics|Information Technology","Bioinformatics, computational biology or related science","Programming|Biology|Statistics","19-1029.01"],
  ["biological-technician","Biological laboratory technician","Laboratory science","Prepare samples and support biological experiments and measurements.","Life Sciences|Physical Sciences|Mathematics","Biotechnology or laboratory science","Sample preparation|Laboratory safety|Record keeping","19-4021.00"],
  ["radiographer","Diagnostic radiographer","Health sciences","Produce diagnostic images while supporting patient comfort and safety.","Physical Sciences|Life Sciences|Mathematics","Diagnostic radiography","Imaging equipment|Patient communication|Precision","29-2034.00"],
  ["optometrist","Optometrist","Health sciences","Examine vision and help people manage their visual needs.","Mathematics|Physical Sciences|Life Sciences","Optometry","Vision assessment|Communication|Clinical reasoning","29-1041.00"],
  ["speech-therapist","Speech-language therapist","Health & communication","Assess communication difficulties and plan supportive therapy.","English|Life Sciences|Mathematics","Speech-language pathology","Listening|Assessment|Therapy planning","29-1127.00"],
  ["veterinary-nurse","Veterinary nurse","Animal health","Support veterinary teams with animal care and clinical procedures.","Life Sciences|Physical Sciences|Mathematics","Veterinary nursing","Animal handling|Observation|Clinical support","29-2056.00"],
  ["landscape-gardener","Landscape gardener","Environment & practical work","Create and maintain planted spaces and outdoor grounds.","Life Sciences|Geography|Agricultural Sciences","Horticulture or practical landscape training","Plant care|Equipment use|Site planning","37-3011.00"],
  ["chef","Chef","Hospitality","Prepare food and coordinate quality, timing and kitchen work.","Hospitality Studies|Consumer Studies|Business Studies","Culinary arts or professional cookery","Food preparation|Kitchen organisation|Teamwork","35-1011.00"],
  ["welder","Welder","Skilled trades","Join metal parts using appropriate equipment and careful safety practices.","Mechanical Technology|Mathematics|Engineering Graphics and Design","Welding training and an accredited artisan route","Welding|Drawing interpretation|Safety","51-4121.00"],
  ["machinist","Machinist / turner","Skilled trades","Use machine tools to produce precise components.","Mechanical Technology|Mathematics|Engineering Graphics and Design","Machining or fitting and turning training","Machine setup|Precision measurement|Fault finding","51-4041.00"],
  ["automotive-technician","Automotive technician","Skilled trades","Inspect vehicles, diagnose faults and carry out repairs.","Mechanical Technology|Mathematics|Physical Sciences","Automotive training and an accredited artisan route","Diagnostics|Mechanical systems|Safety","49-3023.00"],
  ["refrigeration-technician","Refrigeration and air-conditioning technician","Skilled trades","Install, maintain and troubleshoot cooling and ventilation equipment.","Physical Sciences|Mathematics|Electrical Technology","Refrigeration and air-conditioning training","Fault diagnosis|System maintenance|Safe handling","49-9021.00"],
  ["wind-technician","Wind turbine technician","Energy & sustainability","Inspect and maintain turbine equipment and related systems.","Mathematics|Physical Sciences|Electrical Technology","Electrical or mechanical training with wind-sector specialisation","Maintenance|Electrical systems|Working-at-height safety","49-9081.00"],
  ["animator","Animator and visual-effects artist","Creative industries","Develop moving images and effects for visual storytelling.","Visual Arts|Design|Information Technology","Animation, digital arts or a project portfolio","Animation|Visual storytelling|Creative software","27-1014.00"],
  ["game-designer","Game designer","Creative technology","Design game rules, experiences and interactive challenges.","Information Technology|Design|Mathematics","Game design, digital media or related project work","Prototyping|Systems design|Play testing","15-1255.01"],
  ["video-editor","Film and video editor","Media","Shape recorded footage into a clear and engaging sequence.","English|Design|Visual Arts","Film, media production or an editing portfolio","Editing|Story structure|Sound-picture coordination","27-4032.00"],
  ["librarian","Librarian and information specialist","Education & information","Organise resources and help people find and use information.","English|History|Computer Applications Technology","Library and information science","Information retrieval|Cataloguing|Research support","25-4022.00"],
  ["interpreter","Interpreter and translator","Languages & communication","Help people communicate accurately across languages.","Languages|English|History","Language practice, translation or interpreting","Language proficiency|Listening|Contextual accuracy","27-3091.00"],
  ["plumber","Plumber","Skilled trades","Install and repair water supply, drainage and pipe systems.","Mathematics|Physical Sciences|Civil Technology","Plumbing training and an accredited artisan route","Pipe installation|Fault finding|Practical measurement","47-2152.00"],
  ["tour-guide","Tour guide","Tourism & communication","Guide visitors through places and explain their context.","Tourism|Geography|Languages","Tourist guiding training and applicable registration","Public speaking|Local research|Group coordination","39-7011.00"],
];

export const expandedCareers: CareerProfile[] = additions.map(([id,title,field,summary,subjects,study,skills,source]) => ({
  id,title,field,summary,subjects:subjects.split("|"),skills:skills.split("|"),
  salary:"Not yet verified for South Africa",demand:"Check current local vacancies",
  qualifications:[`Investigate accredited study or training in ${study.toLowerCase()}. Confirm local admission, practical training and professional registration requirements with the provider or relevant body.`],
  employers:[],day:summary,
  outlook:"Compare current South African vacancies, training availability and registration requirements. Suggested subjects are exploration leads, not entry requirements.",
  sourceUrl:`https://www.onetonline.org/link/summary/${source}`,
}));
