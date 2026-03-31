MATHU

Deltagare:
Benjamin Terdin AW23
Elias Abdulahad AW23
Aurora Norrstråle AW23
Sean Lundgren AW24
Tristan Berg AW24

Tävlar i kategori:
Bästa AI-Tillämpning
Bästa Helhetslösning

Projekt- & Teknisk beskrivning

Motivering och Introduktion
MathU syftar till att främja motivation och kunskap inom ämnet matematik. För denna demo har vi specifikt lagt fokus på kursen "MA1B", då det finns ett starkt underlag för ett förbättringsbehov här. Enligt betygskatalogen har vi resultat från kursen som sträcker sig tillbaka till 2014. Av 421 resultat har ca 12% (ca 50 elever) fått underkänt, och 54% (ca 230 elever) fått betyget E. MathU är skapat för att höja dessa resultat genom att erbjuda personlig AI-rättning och feedback på plattformen.

Teknisk beskrivning
För att driva MathU använder vi en modern webbarkitektur kombinerad med lokala AI-modeller. 

Användaren möter ett gränssnitt byggt i Next.js. När en elev interagerar med plattformen och vill ha en uppgift rättad, skickas datan via ett virtuellt nätverk (TailScale) till våra lokala AI-modeller. Vi kör två modeller parallellt (Qwen 3.5 och Qwen 3) för att hantera vision, verktyg och text. Dessa rättar uppgiften och skickar tillbaka resultatet till användaren i realtid.


Externt producerade komponenter

Frontend och Plattform
Next.js & React: Utgör grunden för hela vårt webbgränssnitt och routing.
Tailwind CSS: Används för all styling av plattformen.
Framer-Motion: Ramverk för animationer, t.ex. knappanimationer och hover-effekter för en bättre UX.
Vercel: Används för hosting av plattformen.

Backend, Nätverk och AI
Supabase: Används som databas och authentication
LM Studio (Lokala AI-modeller): Vi använder modellerna Qwen 3.5 9b (Vision, Tool & Text) och Qwen 3 4b som ryggraden i vår rättnings- och feedbackmotor.
TailScale: Virtuellt lokalt nätverk som ger ut en virtuell lokal IP-adress till alla anslutna maskiner. Detta låter våra webbklienter kommunicera säkert med våra lokala AI-modeller.
HumanFS: Tolk för att förenkla filhantering i Node.js

Innehåll och Tillgänglighet
i18n: Ramverk för dynamisk översättning (med JSON). Översätter mellan språk.
OpenDyslexic Font: Integrerat för att göra plattformen tillgänglig för elever med dyslexi.
GeoGebra: Låter eleven använda ett digitalt grafritande verktyg
Läromedel & Källor: Uppgifter och prov är hämtade från Natur & Kultur Matematik 5000+ (1b och 1c) och Matteboken.se (nationella prov).
Matheus “Ulf” bild: En avbildning av en mycket duktig mattelärare som ett exemplariskt exempel för elever.
Babel.JS: Kompilator för att konvertera modern JavaScript till bakåtkompatibla versioner.

Install

För att underlätta hela processen vit testning så har vi skapat en vercel länk där projektet går att nås. Detta så att man själv ej behöver installera kod och ramverk enbart för testning, då det är rätt komplicerat att sätta upp kopplingen med våra lokala AI- modeller. 

Notera att rättningen av frågor endast fungerar ifall våra lokala AI modeller är online.
https://mathu-two.vercel.app/plugga 

Om man vill inspektera koden finns den tillgänglig på GitHub. Där kan man även se vilken kod som körs lokalt på ai-datorerna, som man kan hitta i repon i en folder vid namn worker.

Vi kör två lokala AI-modeller parallellt då en inte var nog för den prestanda som vårt arbete krävde. Vi använder en applikation vid namn TailScale vid testning på localhost men sedan mot slutet av projektet, migrerade vi från lokalt workflow med TailScale till workers som arbetar tillsammans med supabase på våra ai-datorer. 

När man kört npm install och därmed har alla node_modules samt alla ramverk borde koden kompilera, och efter att koden har kompilerats bör det ej vara några problem med att besöka plattformen. För att rättningssystemet ska fungera på “MathU” krävs dock kopplingen till supabase och dess workers. 

