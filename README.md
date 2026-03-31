MATHU

Deltagare:
* Benjamin Terdin AW23
* Elias Abdulahad AW23
* Aurora Norrstråle AW23
* Sean Lundgren AW24
* Tristan Berg AW24

Tävlingskategorier:
* Bästa AI-tillämpning
* Bästa helhetslösning

Projekt- & Teknisk beskrivning

Motivering och Introduktion
MathU syftar till att främja motivation och kunskap inom ämnet matematik. För denna demo har vi specifikt lagt fokus på kursen "MA1B", då det finns ett starkt underlag för ett förbättringsbehov här. Enligt betygskatalogen har vi resultat från kursen som sträcker sig tillbaka till 2014. Av 421 resultat har ca 12% (ca 50 elever) fått underkänt, och 54% (ca 230 elever) fått betyget E. MathU är skapat för att höja dessa resultat genom att erbjuda personlig AI-rättning och feedback på plattformen.

Teknisk beskrivning

Plattformen bygger på en modern webbarkitektur i kombination med lokalt körda AI-modeller.

Gränssnittet är utvecklat i Next.js. När en elev skickar in en uppgift för rättning skickas datan via ett virtuellt nätverk till våra lokala AI-modeller. Dessa analyserar lösningen och returnerar feedback i realtid.

För att uppnå tillräcklig prestanda används två modeller parallellt: Qwen 3.5 och Qwen 3. Den ena hanterar bland annat bildtolkning och verktyg, medan den andra fokuserar på textbearbetning och respons. Datorerna som kör ai modellerna har grafikkort med modell RTX 2080 med 8gb VRAM och dessutom 16gb RAM.  

Externt producerade komponenter:
- Frontend och plattform
- Next.js och React används för struktur och routing
- Tailwind CSS används för styling
- Framer Motion används för animationer och interaktioner
- Vercel används för hosting

Backend, nätverk och AI

- Supabase används för databas och autentisering
- LM Studio används för att köra lokala AI-modeller
- Tailscale används för säker kommunikation mellan klient och AI-servrar
- HumanFS används för att förenkla filhantering i Node.js

Innehåll och tillgänglighet

- i18n används för översättning mellan språk
- OpenDyslexic används för att förbättra läsbarhet för elever med dyslexi
- GeoGebra är integrerat för grafritning
- Nationella prov simulationens frågor är hämtade från Matteboken.se
- En lärarfigur (Matheus “Ulf”) används som pedagogiskt stöd i gränssnittet
- Babel används för att säkerställa kompatibilitet med äldre JavaScript-miljöer

Installation och testning

För att förenkla testning finns projektet tillgängligt via en publik Vercel-länk. Det gör att plattformen kan användas direkt utan lokal installation. 

OBS! Rättningssystemet fungerar ej om inte AI-datorerna är online. Det betyder att plattfomren fungerar, men rättningen är inaktiv och alla frågor besvarade kommer resultera i fel, samt felmeddelande.

https://mathu-two.vercel.app/plugga

Källkoden finns tillgänglig på GitHub. Där framgår även den kod som körs på de lokala AI-datorerna för worker funktionen, i en separat mapp kallad worker. Miljövariabler (.env) delas inte, men motsvarande funktionalitet kan upplevas via den publicerade versionen då bland annat frågor, användardata, auth med next.js och mycket mer hämtas därifrån.

Under utvecklingen användes Tailscale för lokal kommunikation. Mot slutet av projektet övergick vi till en lösning där workers samverkar med Supabase, vilket gav en mer stabil och skalbar struktur.

Efter installation av beroenden (npm install) bör projektet kunna kompileras och köras utan problem. För att rättningssystemet ska fungera krävs dock en aktiv koppling till Supabase samt de tillhörande AI-processerna.