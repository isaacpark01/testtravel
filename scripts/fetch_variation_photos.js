// fetch_variation_photos.js
// For items still using generic photos, assigns photos from cuisine/type-specific
// Wikipedia article variations. Each variation article is fetched once, cached,
// then assigned deterministically (name hash) to avoid large-scale duplicates.

const https = require('https');
const fs    = require('fs');
const vm    = require('vm');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* Fetch Wikipedia thumbnail for an article title */
function wikiPhoto(title) {
  return new Promise((resolve) => {
    const path = '/api/rest_v1/page/summary/' + encodeURIComponent(title.trim().replace(/\s+/g,'_'));
    const req = https.get(
      { hostname:'en.wikipedia.org', path, headers:{'User-Agent':'pintrip-app/1.0'} },
      (res) => {
        let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
          try {
            const j=JSON.parse(d);
            if (j.type==='disambiguation') return resolve(null);
            let url = j.thumbnail?.source || j.originalimage?.source || null;
            if (url) {
              if (url.includes('/thumb/')) url=url.replace(/\/\d+px-([^/]+)$/,'/800px-$1');
              if (url.match(/\.(svg|SVG)/)) url=null;
            }
            resolve(url);
          } catch { resolve(null); }
        });
      }
    );
    req.on('error',()=>resolve(null));
    req.setTimeout(7000,()=>{req.destroy();resolve(null);});
  });
}

/* ── Cuisine → article variations (each article has a different photo on Wikipedia) ── */
const CUISINE_VARIATIONS = {
  // Japanese
  'Ramen':        ['Ramen','Tonkotsu ramen','Shoyu ramen','Miso ramen','Tsukemen','Hiyashi chuka'],
  'Sushi':        ['Sushi','Nigiri sushi','Maki roll','Temaki','Chirashi','California roll','Omakase'],
  'Sashimi':      ['Sashimi','Nigiri sushi','Tuna','Salmon (food)','Hamachi'],
  'Tempura':      ['Tempura','Shrimp tempura','Kakiage','Tendon (food)'],
  'Yakitori':     ['Yakitori','Skewer','Chicken (food)','Grilled chicken'],
  'Ramen':        ['Ramen','Tonkotsu ramen','Shoyu ramen','Tsukemen'],
  'Tonkatsu':     ['Tonkatsu','Katsudon','Pork cutlet','Breaded cutlet'],
  'Okonomiyaki':  ['Okonomiyaki','Takoyaki','Japanese pancake'],
  'Udon':         ['Udon','Tempura udon','Kitsune udon','Curry udon'],
  'Wagyu':        ['Wagyu','Kobe beef','A5 beef','Japanese beef'],
  'Omakase':      ['Omakase','Japanese cuisine','Kaiseki','Chef\'s table'],
  'Kaiseki':      ['Kaiseki','Ryokan','Japanese cuisine','Traditional Japanese cuisine'],
  'Izakaya':      ['Izakaya','Japanese pub','Yakitori','Edamame'],
  'Teppanyaki':   ['Teppanyaki','Hibachi','Benihana','Fried rice'],
  'Yakiniku':     ['Yakiniku','Korean barbecue','Grilled meat','Wagyu'],
  'Gyoza':        ['Gyoza','Jiaozi','Dumpling','Potsticker'],
  'Shabu-Shabu':  ['Shabu-shabu','Hot pot','Japanese hot pot'],
  'Japanese':     ['Japanese cuisine','Bento','Onigiri','Miso soup','Matcha','Soba noodle'],
  // Korean
  'Korean BBQ':   ['Korean barbecue','Galbi','Bulgogi','Samgyeopsal','Galbi-jjim'],
  'Bibimbap':     ['Bibimbap','Dolsot bibimbap','Korean rice dish'],
  'Korean':       ['Korean cuisine','Kimchi','Tteokbokki','Japchae','Doenjang jjigae','Sundubu jjigae'],
  'Tteokbokki':   ['Tteokbokki','Rice cake','Korean street food'],
  // Chinese
  'Dim Sum':      ['Dim sum','Char siu bao','Har gow','Shumai','Egg tart','Pineapple bun'],
  'Peking Duck':  ['Peking duck','Duck (food)','Beijing cuisine'],
  'Hot Pot':      ['Hot pot','Sichuan cuisine','Mongolian hot pot'],
  'Dumplings':    ['Dumpling','Jiaozi','Xiaolongbao','Wonton','Baozi'],
  'Chinese':      ['Chinese cuisine','Kung Pao chicken','Mapo tofu','Char siu','Congee','General Tso\'s chicken'],
  'Cantonese':    ['Cantonese cuisine','Dim sum','Wonton soup','Char siu'],
  'Szechuan':     ['Sichuan cuisine','Mapo tofu','Kung Pao chicken','Dan dan noodles'],
  'Noodles':      ['Chinese noodles','Lo mein','Chow mein','Dan dan noodles','Hand-pulled noodles'],
  // Japanese-Korean (common)
  'Noodles':      ['Ramen','Pho','Udon','Soba noodle','Pad thai','Laksa'],
  // Southeast Asian
  'Pho':          ['Phở','Vietnamese cuisine','Beef noodle soup','Broth'],
  'Banh Mi':      ['Bánh mì','Vietnamese sandwich','Baguette sandwich'],
  'Vietnamese':   ['Vietnamese cuisine','Pho','Bánh mì','Bún bò Huế','Gỏi cuốn'],
  'Pad Thai':     ['Pad thai','Thai noodles','Rice noodle'],
  'Green Curry':  ['Green curry','Thai curry','Coconut milk curry'],
  'Tom Yum':      ['Tom yum','Thai soup','Spicy soup'],
  'Thai':         ['Thai cuisine','Pad thai','Green curry','Tom yum','Mango sticky rice','Papaya salad'],
  'Laksa':        ['Laksa','Singaporean cuisine','Noodle soup'],
  'Nasi Goreng':  ['Nasi goreng','Indonesian fried rice'],
  'Satay':        ['Satay','Peanut sauce','Skewer'],
  'Singaporean':  ['Singaporean cuisine','Hainanese chicken rice','Laksa','Chili crab','Char kway teow'],
  'Malaysian':    ['Malaysian cuisine','Nasi lemak','Roti canai','Char kway teow'],
  'Indonesian':   ['Indonesian cuisine','Nasi goreng','Rendang','Sate','Gado-gado'],
  'Balinese':     ['Balinese cuisine','Nasi campur','Babi guling','Sate lilit'],
  'Filipino':     ['Filipino cuisine','Adobo','Sinigang','Lechon','Kare-kare'],
  // Indian
  'Indian':       ['Indian cuisine','Butter chicken','Curry','Biryani','Dal makhani','Samosa','Naan'],
  'Curry':        ['Curry','Indian curry','Butter chicken','Tikka masala','Vindaloo','Saag'],
  'Biryani':      ['Biryani','Hyderabadi biryani','Dum biryani','Chicken biryani'],
  'Dosa':         ['Dosa','Masala dosa','Idli','South Indian cuisine'],
  'Tandoori':     ['Tandoori chicken','Tandoor','Naan','Indian bread'],
  'North Indian': ['North Indian cuisine','Butter chicken','Dal makhani','Paneer tikka'],
  'South Indian': ['South Indian cuisine','Dosa','Idli','Sambar','Rasam'],
  // Middle East / Mediterranean
  'Middle Eastern':['Middle Eastern cuisine','Falafel','Hummus','Shawarma','Kebab','Mezze'],
  'Lebanese':     ['Lebanese cuisine','Hummus','Tabbouleh','Falafel','Kibbeh','Mezze'],
  'Israeli':      ['Israeli cuisine','Falafel','Shakshuka','Hummus','Sabich'],
  'Turkish':      ['Turkish cuisine','Kebab','Baklava','Meze','Pide','Döner kebab'],
  'Kebab':        ['Kebab','Döner kebab','Seekh kebab','Shish kebab','Dürüm'],
  'Falafel':      ['Falafel','Israeli cuisine','Middle Eastern cuisine'],
  'Hummus':       ['Hummus','Chickpea','Israeli cuisine'],
  'Persian':      ['Persian cuisine','Ghormeh sabzi','Chelo kebab','Fesenjan'],
  'Moroccan':     ['Moroccan cuisine','Couscous','Tagine','Harira','Bastilla'],
  'Egyptian':     ['Egyptian cuisine','Koshari','Ful medames','Ta\'meya'],
  'Ethiopian':    ['Ethiopian cuisine','Injera','Wat','Tibs','Kitfo'],
  'Mediterranean':['Mediterranean cuisine','Greek cuisine','Moussaka','Spanakopita','Dolmades'],
  'Greek':        ['Greek cuisine','Moussaka','Souvlaki','Spanakopita','Dolmades','Tzatziki'],
  // European
  'Italian':      ['Italian cuisine','Pasta','Risotto','Ossobuco','Carbonara','Amatriciana','Cacio e pepe','Tiramisu'],
  'Pizza':        ['Pizza','Neapolitan pizza','New York-style pizza','Pizza Margherita','Calzone','Focaccia'],
  'Pasta':        ['Pasta','Spaghetti','Fettuccine','Penne','Rigatoni','Lasagna','Carbonara'],
  'Risotto':      ['Risotto','Milanese risotto','Mushroom risotto','Seafood risotto'],
  'Gelato':       ['Gelato','Italian ice cream','Sorbetto','Granita'],
  'Tiramisu':     ['Tiramisu','Italian dessert','Coffee dessert'],
  'Spanish':      ['Spanish cuisine','Paella','Tapas','Jamón ibérico','Gazpacho','Churros','Tortilla española'],
  'Tapas':        ['Tapas','Spanish cuisine','Pintxos','Patatas bravas','Tortilla española'],
  'Paella':       ['Paella','Valencian paella','Seafood paella'],
  'French':       ['French cuisine','Boeuf bourguignon','Croissant','Crème brûlée','French onion soup','Coq au vin','Ratatouille'],
  'Croissant':    ['Croissant','Viennoiserie','Patisserie','Pain au chocolat'],
  'Crepes':       ['Crêpe','Galette','French pancake'],
  'Boulangerie':  ['Boulangerie','Bread','French bread','Croissant'],
  'Bistro':       ['Bistro','French restaurant','Steak frites','Croque monsieur'],
  'German':       ['German cuisine','Bratwurst','Sauerkraut','Pretzel','Schnitzel','Lebkuchen'],
  'Austrian':     ['Austrian cuisine','Wiener Schnitzel','Sachertorte','Apfelstrudel'],
  'British':      ['British cuisine','Fish and chips','Full breakfast','Pie','Yorkshire pudding'],
  'Fish and Chips':['Fish and chips','Cod','British cuisine'],
  'Irish':        ['Irish cuisine','Irish stew','Soda bread','Full Irish breakfast'],
  'Belgian':      ['Belgian cuisine','Waffles','Belgian chocolate','Mussels and fries','Speculoos'],
  'Dutch':        ['Dutch cuisine','Stroopwafel','Dutch cheese','Poffertjes','Bitterballen'],
  'Swedish':      ['Swedish cuisine','Swedish meatballs','Gravlax','Smörgåsbord','Cinnamon roll'],
  'Nordic':       ['Nordic cuisine','New Nordic cuisine','Smörrebröd','Aquavit'],
  'Portuguese':   ['Portuguese cuisine','Bacalhau','Pastel de nata','Francesinha','Caldo verde'],
  'Scandinavian': ['Scandinavian cuisine','Gravlax','Smörgåsbord','Lutefisk'],
  'Polish':       ['Polish cuisine','Pierogi','Żurek','Bigos','Kielbasa'],
  'Eastern European': ['Eastern European cuisine','Pierogi','Borscht','Goulash','Wiener Schnitzel'],
  'Hungarian':    ['Hungarian cuisine','Goulash','Chicken paprikash','Lángos','Kürtőskalács'],
  'Czech':        ['Czech cuisine','Svíčková','Guláš','Trdelník','Czech goulash'],
  'Russian':      ['Russian cuisine','Borscht','Beef Stroganoff','Pelmeni','Blini'],
  // American
  'American':     ['American cuisine','Hamburger','Hot dog','Apple pie','Buffalo wing','Mac and cheese','Cheesesteak'],
  'American BBQ': ['Barbecue in the United States','Texas barbecue','Kansas City-style barbecue','Pulled pork','Brisket'],
  'BBQ':          ['Barbecue','Pulled pork','Brisket','Baby back ribs','Smoked meat','Pork ribs'],
  'Fried Chicken':['Fried chicken','Southern fried chicken','Nashville hot chicken','Popeyes'],
  'Burgers':      ['Hamburger','Cheeseburger','Veggie burger','Smash burger','In-N-Out Burger'],
  'Steakhouse':   ['Steakhouse','Beefsteak','Ribeye steak','T-bone steak','New York strip steak'],
  'Steak':        ['Beefsteak','Ribeye','T-bone steak','Filet mignon','Porterhouse steak'],
  'Soul Food':    ['Soul food','Collard greens','Cornbread','Catfish','Macaroni and cheese'],
  'Creole':       ['Creole cuisine','Gumbo','Jambalaya','Étouffée','Beignet'],
  'Cajun':        ['Cajun cuisine','Crawfish','Gumbo','Étouffée','Boudin'],
  'Tex-Mex':      ['Tex-Mex cuisine','Nachos','Fajita','Queso dip','Breakfast taco'],
  'Mexican':      ['Mexican cuisine','Taco','Enchilada','Burrito','Mole','Guacamole','Tamale','Pozole'],
  'Tacos':        ['Taco','Al pastor','Carnitas','Barbacoa','Fish taco','Street taco'],
  'Burrito':      ['Burrito','Mission burrito','Chipotle Mexican Grill','Quesadilla'],
  'Empanadas':    ['Empanada','Argentine empanada','Chilean empanada'],
  'Cuban':        ['Cuban cuisine','Cuban sandwich','Ropa vieja','Moros y Cristianos','Arroz con pollo'],
  'Caribbean':    ['Caribbean cuisine','Jerk chicken','Roti','Doubles','Oxtail'],
  'Latin American': ['Latin American cuisine','Ceviche','Empanada','Arepa','Choripán'],
  'Peruvian':     ['Peruvian cuisine','Ceviche','Lomo saltado','Anticucho','Causa'],
  'Colombian':    ['Colombian cuisine','Bandeja paisa','Arepas','Sancocho','Lechona'],
  'Venezuelan':   ['Venezuelan cuisine','Arepa','Hallaca','Cachapa','Pabellón criollo'],
  'Brazilian':    ['Brazilian cuisine','Churrasco','Feijoada','Coxinha','Pão de queijo','Açaí'],
  'Argentinian':  ['Argentine cuisine','Asado','Empanada','Chimichurri','Dulce de leche','Milanesa'],
  // Seafood
  'Seafood':      ['Seafood','Shrimp','Lobster','Crab','Oyster','Scallop','Grilled fish'],
  'Oysters':      ['Oyster','Raw bar','Oyster bar'],
  'Lobster':      ['Lobster','Maine lobster','Lobster roll','Lobster bisque'],
  'Fish':         ['Fish (food)','Grilled fish','Fish dish','Pan-fried fish'],
  'Crab':         ['Crab','Blue crab','Soft-shell crab','Crab cake'],
  // Drinks / Desserts
  'Coffee':       ['Coffee','Espresso','Cappuccino','Latte','Specialty coffee','Pour over coffee'],
  'Tea':          ['Tea','Green tea','Black tea','Oolong','Matcha','Bubble tea'],
  'Wine':         ['Wine','Red wine','White wine','Rosé wine','Champagne','Vineyard'],
  'Beer':         ['Beer','Craft beer','IPA','Stout','Brewing','Pint of beer'],
  'Cocktails':    ['Cocktail','Martini','Old fashioned','Mojito','Negroni','Whisky sour'],
  'Whiskey':      ['Whiskey','Bourbon','Scotch','Whisky','Distillery'],
  'Spirits':      ['Distilled beverage','Cocktail','Whiskey','Rum','Tequila'],
  'Ice Cream':    ['Ice cream','Gelato','Soft serve','Sundae','Milkshake','Ice cream parlor'],
  'Dessert':      ['Dessert','Cheesecake','Chocolate cake','Tiramisu','Panna cotta','Macaron'],
  'Cake':         ['Cake','Layer cake','Wedding cake','Chocolate cake','Carrot cake'],
  'Bakery':       ['Bakery','Croissant','Bread','Pastry','Baguette','Sourdough'],
  'Pastry':       ['Pastry','Croissant','Danish pastry','Tart','Éclair'],
  'Brunch':       ['Brunch','Eggs Benedict','Avocado toast','Pancake','Waffle','Mimosa'],
  'Breakfast':    ['Breakfast','Eggs','Full breakfast','Pancake','French toast'],
  'Deli':         ['Delicatessen','Pastrami','Reuben sandwich','Smoked salmon'],
  'Sandwich':     ['Sandwich','Club sandwich','BLT','Hoagie','Submarine sandwich'],
  'Burgers':      ['Hamburger','Cheeseburger','Veggie burger','Smash burger'],
  'Hot Dog':      ['Hot dog','Chicago-style hot dog','New York-style hot dog','Corn dog'],
  'Street Food':  ['Street food','Food truck','Night market food','Hawker centre'],
  'Market':       ['Food market','Farmers market','Night market','Street food market'],
  // General fallbacks
  'Modern':       ['Modern cuisine','Fusion cuisine','Contemporary food','Fine dining'],
  'Fine Dining':  ['Fine dining restaurant','Tasting menu','Michelin Guide','Restaurant'],
  'Fusion':       ['Fusion cuisine','New American cuisine','Modern cuisine'],
  'Vegetarian':   ['Vegetarian cuisine','Vegan food','Plant-based diet','Salad'],
  'Vegan':        ['Vegan cuisine','Plant-based diet','Vegetable dish'],
  'Healthy':      ['Health food','Salad','Grain bowl','Smoothie bowl'],
  // Specific compound types (added for better coverage)
  'New American':        ['New American cuisine','Farm-to-table','Gastropub','Hamburger','American cuisine','Buffalo wing'],
  'Modern American':     ['New American cuisine','American cuisine','Hamburger','Mac and cheese','Apple pie','Cheesesteak'],
  'Modern European':     ['European cuisine','Sous vide','Fine dining','Risotto','Confit','Ratatouille'],
  'Café':                ['Café','Coffeehouse','Coffee','Espresso','Croissant','Latte'],
  'Cafe':                ['Café','Coffeehouse','Coffee','Espresso','Croissant','Latte'],
  'All-Day Café':        ['Café','Brunch','Avocado toast','Eggs Benedict','Coffee','Pancake'],
  'All-Day Cafe':        ['Café','Brunch','Avocado toast','Eggs Benedict','Coffee','Pancake'],
  'Modern Café':         ['Specialty coffee','Latte art','Café','Pour-over coffee','Cold brew coffee','Flat white'],
  'Modern Cafe':         ['Specialty coffee','Latte art','Café','Pour-over coffee','Cold brew coffee','Flat white'],
  'Specialty Coffee':    ['Specialty coffee','Third-wave coffee','Pour-over coffee','Coffee roasting','Latte art','Espresso'],
  'Cocktail Bar':        ['Cocktail bar','Cocktail','Speakeasy','Bartender','Mixology','Negroni'],
  'Cocktail':            ['Cocktail','Martini','Old fashioned','Mojito','Negroni','Whisky sour'],
  'French Brasserie':    ['Brasserie','French cuisine','Steak frites','Moules frites','French onion soup','Croque monsieur'],
  'French Bistro':       ['Bistro','French cuisine','Steak frites','Croque monsieur','Onion soup','Ratatouille'],
  'French Fine Dining':  ['French cuisine','Haute cuisine','Boeuf bourguignon','Coq au vin','Crème brûlée','Sole meunière'],
  'Italian Fine Dining': ['Italian cuisine','Ossobuco','Carbonara','Cacio e pepe','Risotto','Bistecca alla fiorentina'],
  'Japanese Izakaya':    ['Izakaya','Yakitori','Edamame','Karaage','Tonkatsu','Japanese pub'],
  'Street Tacos':        ['Taco','Al pastor','Street taco','Carnitas','Carne asada','Fish taco'],
  'Creative Tacos':      ['Taco','Gourmet taco','Fish taco','Al pastor','Birria','Modern Mexican cuisine'],
  'Northern Thai':       ['Northern Thai cuisine','Khao soi','Larb','Sai ua','Nam phrik','Chiang Mai'],
  'British Gastropub':   ['Gastropub','British pub','Pie','Scotch egg','Fish and chips','Yorkshire pudding'],
  'Food Market':         ['Food market','Farmers market','Borough Market','Pike Place Market','Night market','Hawker centre'],
  'Texas BBQ':           ['Texas barbecue','Brisket','Smoked meat','Baby back ribs','Pulled pork','Barbecue sauce'],
  'American BBQ':        ['Barbecue in the United States','Texas barbecue','Pulled pork','Brisket','Smoked meat','Ribs'],
  'Gourmet Sandwiches':  ['Sandwich','Submarine sandwich','Club sandwich','Panini','Hoagie','Italian beef'],
  'Sandwiches':          ['Sandwich','Club sandwich','Hoagie','Submarine sandwich','Panini','BLT'],
  'Jewish Deli':         ['Delicatessen','Pastrami','Reuben sandwich','Lox','Matzo ball soup','Jewish cuisine'],
  'Old School Steakhouse':['Steakhouse','Beefsteak','Ribeye steak','T-bone steak','New York strip steak','Peter Luger Steak House'],
  'Neapolitan Pizza':    ['Neapolitan pizza','Pizza Margherita','Mozzarella di bufala','Pizza','Focaccia','Italian bread'],
  'Mexican Seafood':     ['Mexican cuisine','Fish taco','Ceviche','Shrimp taco','Aguachile','Mariscos'],
  'Nashville Hot Chicken':['Nashville hot chicken','Fried chicken','Hot chicken','Southern fried chicken','Chicken sandwich'],
  'Southern':            ['Soul food','Southern United States cuisine','Fried chicken','Collard greens','Cornbread','Shrimp and grits'],
  'Sichuan Chinese':     ['Sichuan cuisine','Mapo tofu','Kung Pao chicken','Dan dan noodles','Sichuan hotpot','Twice cooked pork'],
  'Israeli Bakery':      ['Israeli cuisine','Challah','Babka','Rugelach','Knafeh','Sufganiyah'],
  'Gastropub':           ['Gastropub','British pub','Pub food','Scotch egg','Pie','Beer'],
  'Wine Bar':            ['Wine bar','Wine','Charcuterie','Cheese board','Wine tasting','Sommelier'],
  'Sake Bar':            ['Sake','Japanese rice wine','Izakaya','Japanese pub','Umeshu'],
  'Ramen Bar':           ['Ramen','Tonkotsu ramen','Shoyu ramen','Miso ramen','Tsukemen'],
  'Sushi Bar':           ['Sushi','Nigiri sushi','Temaki','Omakase','Maki roll','Sashimi'],
  'Tapas Bar':           ['Tapas','Pintxos','Spanish cuisine','Patatas bravas','Jamón ibérico'],
  'Sports Bar':          ['Sports bar','American cuisine','Hamburger','Buffalo wing','Beer'],
  'Dive Bar':            ['Bar','Tavern','Pub','Beer','Cocktail'],
  'Rooftop Bar':         ['Rooftop bar','Cocktail','City skyline','Bar','Rooftop'],
  'Oyster Bar':          ['Oyster','Oyster bar','Seafood','Raw bar','Lobster'],
  'Raw Bar':             ['Raw bar','Oyster','Clam','Seafood','Ceviche'],
  'Churrascaria':        ['Churrasco','Brazilian barbecue','Brazilian cuisine','Picanha','Feijoada'],
  'Steakhouse':          ['Steakhouse','Beefsteak','Ribeye steak','T-bone steak','New York strip steak','Filet mignon'],
  'Barbeque':            ['Barbecue','Pulled pork','Brisket','Baby back ribs','Smoked meat'],
  'Farm-to-Table':       ['Farm-to-table','Organic food','Seasonal cooking','Local food','Vegetable'],
  'Izakaya':             ['Izakaya','Yakitori','Japanese pub','Edamame','Karaage','Tonkatsu'],
  // Hawaiian / Pacific
  'Poke':                ['Poke (fish salad)','Hawaiian cuisine','Tuna','Salmon (food)','Soy sauce'],
  'Hawaiian Plate Lunch':['Plate lunch','Hawaiian cuisine','Loco moco','Kalua pig','Poi'],
  'Traditional Hawaiian': ['Hawaiian cuisine','Poi','Kalua pig','Laulau','Haupia','Plate lunch'],
  'Shrimp Plate':        ['Shrimp','Garlic shrimp','Hawaiian cuisine','Shrimp scampi','Shellfish'],
  // Spanish/Basque
  'Cava Bar':            ['Cava (Spanish wine)','Spanish cuisine','Tapas','Sparkling wine','Champagne'],
  'Basque Wood-Fire':    ['Basque cuisine','Pintxos','Txakoli','Wood-fired oven','Basque Country'],
  // European regional
  'Roman':               ['Roman cuisine','Cacio e pepe','Carbonara','Amatriciana','Suppli','Carciofi alla romana'],
  'Dutch Home Cooking':  ['Dutch cuisine','Stamppot','Erwtensoep','Stroopwafel','Bitterballen'],
  'Dutch Brown Café':    ['Dutch café','Dutch cuisine','Heineken','Jenever','Bitterballen','Pub'],
  'Cal-Med':             ['California cuisine','Mediterranean cuisine','Avocado','Grilled fish','Salad','Sourdough'],
  // Bar & Grill styles
  'Bar & Grill':         ['American cuisine','Hamburger','Grilled chicken','Buffalo wing','Beer','Restaurant'],
  'Beachfront Bar & Grill':['Beach restaurant','Seafood','Grilled fish','Tropical food','Beach bar'],
  'Grilled Meats':       ['Grilling','Barbecue','Steak','Grilled chicken','Skewer','Asado'],
  // Soups / Comfort food
  'Chicken Noodle Soup': ['Chicken soup','Noodle soup','Comfort food','Broth','Chicken'],
  'Diner Burger':        ['Diner','Hamburger','Cheeseburger','American diner','Milkshake'],
  // Regional
  'Puerto Rican':        ['Puerto Rican cuisine','Mofongo','Pernil','Arroz con gandules','Tostones'],
  'Chicago Dog':         ['Chicago-style hot dog','Hot dog','Chicago cuisine','American cuisine'],
  // General extras
  'Bar':                 ['Bar','Cocktail bar','Pub','Beer','Cocktail'],
  'Grill':               ['Grill','Grilling','Barbecue','Steakhouse','Grilled meat'],
  'Diner':               ['Diner','American diner','Breakfast','Hamburger','Milkshake'],
  'Bistro':              ['Bistro','French cuisine','Steak frites','Croque monsieur','Onion soup'],
  'Brasserie':           ['Brasserie','French cuisine','Moules frites','French onion soup','Steak frites'],
  'Trattoria':           ['Trattoria','Italian cuisine','Pasta','Pizza','Antipasto'],
  'Osteria':             ['Osteria','Italian cuisine','Pasta','Wine','Antipasto'],
  'Ramen Shop':          ['Ramen','Tonkotsu ramen','Shoyu ramen','Miso ramen','Tsukemen'],
  'Poke Bowl':           ['Poke (fish salad)','Tuna','Salmon (food)','Hawaiian cuisine','Soy sauce'],
  'Acai Bowl':           ['Açaí bowl','Açaí','Smoothie bowl','Brazilian cuisine','Tropical fruit'],
  'Grain Bowl':          ['Grain bowl','Farro','Quinoa','Salad','Healthy food'],
  'Buddha Bowl':         ['Buddha bowl','Grain bowl','Vegetarian cuisine','Salad','Quinoa'],
  'Smoothie Bowl':       ['Smoothie bowl','Açaí bowl','Fruit','Tropical fruit','Health food'],
  'Cheesesteak':         ['Cheesesteak','Philadelphia cheesesteak','Sandwich','Philadelphia'],
  'Philly Cheesesteak':  ['Cheesesteak','Philadelphia cheesesteak','Sandwich'],
  'Barbecue':            ['Barbecue','Pulled pork','Brisket','Baby back ribs','Smoked meat'],
  'Smokehouse':          ['Barbecue','Smoked meat','Brisket','Pulled pork','Baby back ribs'],
  'Steaks':              ['Beefsteak','Ribeye steak','Filet mignon','T-bone steak','Grilling'],
  'Lobster Roll':        ['Lobster roll','Lobster','New England cuisine','Seafood'],
  'Clam Chowder':        ['Clam chowder','New England clam chowder','Soup','Seafood','Boston'],
  'Fish Tacos':          ['Fish taco','Taco','Baja California cuisine','Mexican cuisine','Ceviche'],
  'Acai':                ['Açaí','Açaí bowl','Brazilian cuisine','Superfood','Smoothie bowl'],
  'Nasi Lemak':          ['Nasi lemak','Malaysian cuisine','Coconut milk','Pandan','Ikan bilis'],
  'Chicken Rice':        ['Hainanese chicken rice','Chicken rice','Singaporean cuisine'],
  'Char Siu':            ['Char siu','Cantonese cuisine','Barbecue pork','Roast pork'],
  'Wonton Noodle':       ['Wonton noodle','Wonton soup','Chinese noodles','Cantonese cuisine'],
  'Roast Duck':          ['Roast duck','Peking duck','Cantonese cuisine','Duck (food)'],
  'Miso Soup':           ['Miso soup','Japanese cuisine','Miso','Tofu','Seaweed'],
  'Yakisoba':            ['Yakisoba','Japanese noodles','Fried noodles'],
  'Onigiri':             ['Onigiri','Japanese rice ball','Japanese cuisine'],
  'Takoyaki':            ['Takoyaki','Octopus','Japanese street food','Osaka'],
  'Matcha':              ['Matcha','Green tea','Japanese tea ceremony','Wagashi'],
  'Boba':                ['Bubble tea','Tapioca','Milk tea','Taiwanese tea'],
  'Bubble Tea':          ['Bubble tea','Tapioca','Milk tea','Taiwanese cuisine'],
  'Milk Tea':            ['Milk tea','Bubble tea','Hong Kong cuisine','Taiwanese tea'],
  'Craft Beer':          ['Craft beer','Microbrewery','IPA','Brewing','Pale ale'],
  'Natural Wine':        ['Natural wine','Wine','Biodynamic wine','Orange wine','Winery'],
  'Sake':                ['Sake','Japanese rice wine','Nihonshu','Junmai'],
  'Mezcal':              ['Mezcal','Agave','Oaxacan cuisine','Mexican distilled beverage'],
  'Tequila':             ['Tequila','Margarita','Agave','Mexican distilled beverage'],
  'Gin Bar':             ['Gin','Martini','Cocktail','Distillery','Tonic water'],
  'Whisky Bar':          ['Whisky','Bourbon','Scotch','Distillery','Cocktail'],
  'Rum Bar':             ['Rum','Daiquiri','Mojito','Caribbean cuisine','Cocktail'],
  // Australian / Pacific
  'Australian Burger':   ['Hamburger','Australian cuisine','Cheeseburger','Smash burger','Beef'],
  'Asian-Australian':    ['Australian cuisine','Fusion cuisine','Asian cuisine','Modern Australian cuisine'],
  'Modern Australian':   ['Modern Australian cuisine','Australian cuisine','Fusion cuisine'],
  // Asian regional specialties
  'Hawker Centre':       ['Hawker centre','Singaporean cuisine','Malaysian cuisine','Street food','Food court'],
  'Hawker Food':         ['Hawker centre','Street food','Malaysian cuisine','Singaporean cuisine'],
  'Bak Kut Teh':         ['Bak kut teh','Pork rib soup','Malaysian cuisine','Singaporean cuisine'],
  'Peranakan':           ['Peranakan cuisine','Nyonya','Laksa','Singaporean cuisine','Malaysian cuisine'],
  'Nasi Padang':         ['Nasi Padang','Indonesian cuisine','Rendang','Padang cuisine'],
  'Murtabak':            ['Murtabak','Indian-influenced food','Singapore','Malaysian cuisine'],
  'Oyster Omelette':     ['Oyster omelette','Taiwanese cuisine','Hokkien cuisine','Street food'],
  'Beef Katsu':          ['Gyukatsu','Wagyu','Tonkatsu','Beefsteak','Katsu'],
  'Crispy Duck':         ['Peking duck','Duck (food)','Crispy duck','Chinese cuisine','Cantonese cuisine'],
  'Street Snacks':       ['Street food','Snack','Asian street food','Night market','Hawker centre'],
  'Convenience Store':   ['Japanese convenience store','Onigiri','Bento','Japanese food','Instant noodles'],
  // European regional
  'Tuscan':              ['Tuscan cuisine','Bistecca alla fiorentina','Ribollita','Pici','Italian cuisine'],
  'Sicilian Slice':      ['Sicilian pizza','Pizza','Italian cuisine','Tomato sauce','Mozzarella'],
  'Bodega Lunch':        ['Spanish cuisine','Tapas','Wine','Bodegas','Spanish restaurant'],
  'Roman':               ['Roman cuisine','Cacio e pepe','Carbonara','Amatriciana','Italian cuisine'],
  'Traditional Pub':     ['Pub','British pub','Ales','Pie','British cuisine','Yorkshire pudding'],
  // Middle Eastern regional
  'Iranian Kabab':       ['Iranian cuisine','Kebab','Chelo kabab','Persian cuisine','Lamb'],
  'Emirati':             ['Emirati cuisine','Machboos','Harees','Traditional Emirati food','Luqaimat'],
  'Traditional Emirati': ['Emirati cuisine','Machboos','Harees','Dubai','Arabian Peninsula'],
  'Pakistani':           ['Pakistani cuisine','Biryani','Nihari','Karahi','Chapli kebab'],
  // Hawaiian
  'Saimin & Dry Mein':   ['Saimin','Hawaiian noodle soup','Ramen','Noodle soup','Hawaii'],
  'Shave Ice':           ['Shave ice','Hawaiian shave ice','Snow cone','Tropical dessert'],
  // New Orleans
  'Po-Boys':             ['Po\' boy','Sandwich','New Orleans cuisine','Louisiana','Fried shrimp'],
  // American regional
  'Pies & Comfort':      ['Pie','American cuisine','Comfort food','Pot pie','Apple pie'],
  'Gourmet Slider':      ['Slider','Hamburger','Cheeseburger','Gourmet burger','Mini burger'],
  // Asian noodles
  'Cold Noodles':        ['Cold noodles','Naengmyeon','Hiyashi chuka','Soba noodle','Noodle dish'],
  'Taiwanese':           ['Taiwanese cuisine','Beef noodle soup','Scallion pancake','Oyster vermicelli'],
  'Hainanese Chicken':   ['Hainanese chicken rice','Chicken rice','Singaporean cuisine'],
  // Final coverage pass
  'Warung':              ['Warung','Indonesian cuisine','Nasi goreng','Balinese cuisine','Warungs Bali'],
  'Macanese':            ['Macanese cuisine','Macau','Portuguese cuisine','Egg tart','African chicken'],
  'New Zealand Pub':     ['Pub','New Zealand cuisine','Beer','Fish and chips','Kiwi food'],
  'Mid-Atlantic':        ['Mid-Atlantic cuisine','Crab cake','Maryland blue crab','Chesapeake Bay','Old Bay'],
  'Doughnuts':           ['Doughnut','Donut','Krispy Kreme','Glazed doughnut','Bakery'],
  'Local Plate Lunch':   ['Plate lunch','Hawaiian cuisine','Loco moco','Kalua pig','Poi'],
  'Pastel de Nata':      ['Pastel de nata','Portuguese cuisine','Custard tart','Egg tart','Lisbon'],
  'Global Comfort Food': ['Comfort food','Mac and cheese','Hamburger','Fried chicken','Pizza'],
  'Global Comfort':      ['Comfort food','Mac and cheese','Hamburger','Ramen','Pizza'],
  'Meat & Three':        ['Soul food','Southern United States cuisine','Fried chicken','Collard greens','Cornbread'],
  'California Cuisine':  ['California cuisine','Farm-to-table','Avocado','Wine','Sourdough bread'],
  'Southwestern':        ['Southwestern United States cuisine','Tex-Mex cuisine','New Mexican cuisine','Chili pepper','Taco'],
  'Vegetable-Focused':   ['Vegetarian cuisine','Vegan food','Plant-based diet','Salad','Grain bowl'],
  'Espresso':            ['Espresso','Coffee','Coffeehouse','Barista','Latte art'],
  'Tibetan':             ['Tibetan cuisine','Momos','Tsampa','Thukpa','Butter tea'],
  'Food Hall':           ['Food court','Food hall','Food market','Market','Street food'],
  'Waffles':             ['Waffle','Belgian waffle','Brunch','Breakfast','Pancake'],
  'Beijing':             ['Beijing cuisine','Peking duck','Zha jiang mian','Jianbing','Northern Chinese cuisine'],
  'Nigerian':            ['Nigerian cuisine','Jollof rice','Egusi soup','Suya','Puff puff'],
};

/* Activity type keyword → Wikipedia article variations */
const ACTIVITY_VARIATIONS = {
  'museum':       ['Museum','Art museum','Natural history museum','Science museum','History museum','Exhibition'],
  'art':          ['Art museum','Art gallery','Contemporary art','Modern art','Street art','Mural'],
  'gallery':      ['Art gallery','Exhibition','Museum','Photography exhibition'],
  'history':      ['History museum','Ancient history','Historical site','Archaeological site'],
  'science':      ['Science museum','Planetarium','Technology museum','Natural history museum'],
  'park':         ['Urban park','National park','City park','Botanical garden','Recreation area'],
  'garden':       ['Botanical garden','Japanese garden','Rose garden','Zen garden'],
  'beach':        ['Beach','Tropical beach','Surfing','Sunbathing','Coastal scenery'],
  'mountain':     ['Mountain','Mountain landscape','Hiking','Alpine scenery','Peak'],
  'hiking':       ['Hiking','Trail','Trekking','Mountain trail','Nature walk'],
  'temple':       ['Buddhist temple','Temple','Shinto shrine','Hindu temple','Sacred site'],
  'shrine':       ['Shinto shrine','Shrine','Temple','Sacred site'],
  'church':       ['Church','Cathedral','Basilica','Chapel','Gothic architecture'],
  'mosque':       ['Mosque','Islamic architecture','Minaret','Prayer hall'],
  'palace':       ['Palace','Royal palace','Château','Villa','Manor house'],
  'castle':       ['Castle','Fortress','Medieval castle','Ruins','Tower'],
  'cathedral':    ['Cathedral','Gothic cathedral','Basilica','Church architecture'],
  'market':       ['Market','Bazaar','Night market','Farmers market','Flea market','Souk'],
  'night market': ['Night market','Street food market','Night bazaar','Asian night market'],
  'street':       ['Street photography','Urban exploration','City street','Pedestrian street'],
  'tour':         ['Walking tour','City tour','Guided tour','Sightseeing'],
  'concert':      ['Concert','Music venue','Live music','Festival','Amphitheater'],
  'theater':      ['Theatre','Broadway','Stage performance','Ballet','Opera'],
  'opera':        ['Opera house','Opera','Classical music','Concert hall'],
  'festival':     ['Festival','Street festival','Cultural festival','Music festival'],
  'zoo':          ['Zoo','Animal park','Safari park','Wildlife park'],
  'aquarium':     ['Aquarium','Marine aquarium','Fish','Coral reef','Underwater'],
  'waterfall':    ['Waterfall','Cascade','Natural waterfall'],
  'lake':         ['Lake','Lakeside','Mountain lake','Swimming lake'],
  'island':       ['Island','Tropical island','Island landscape','Beach island'],
  'tower':        ['Tower','Observation tower','Skyscraper','Viewpoint'],
  'bridge':       ['Bridge','Suspension bridge','Golden Gate Bridge','Pedestrian bridge'],
  'canal':        ['Canal','Waterway','River canal','Gondola'],
  'river':        ['River','Riverside','Waterfront','River cruise'],
  'sunset':       ['Sunset','Sunset view','Golden hour','Evening sky'],
  'sunrise':      ['Sunrise','Morning','Dawn','Golden hour'],
  'cooking':      ['Cooking class','Culinary school','Chef','Kitchen','Food preparation'],
  'wine':         ['Wine tasting','Vineyard','Winery','Cellar','Wine tour'],
  'brewery':      ['Brewery','Craft brewery','Beer tasting','Microbrewery'],
  'stadium':      ['Stadium','Sports venue','Football stadium','Arena'],
  'golf':         ['Golf course','Golf','Putting green'],
  'surfing':      ['Surfing','Surf','Wave','Surfboard','Beach sport'],
  'kayaking':     ['Kayaking','Sea kayak','River kayaking','Paddling'],
  'cycling':      ['Cycling','Bicycle','Bike path','Mountain biking'],
  'skiing':       ['Skiing','Ski slope','Snowboard','Winter sport','Ski resort'],
  'spa':          ['Spa','Hot spring','Onsen','Thermal bath','Wellness'],
  'hot spring':   ['Hot spring','Onsen','Geothermal','Bathing'],
  'cruise':       ['Cruise','River cruise','Harbor cruise','Sailboat'],
  'cable car':    ['Cable car','Gondola','Aerial tramway','Funicular'],
  'viewpoint':    ['Viewpoint','Observation deck','Panorama','Vista'],
  'sunset cruise':['Sunset','Harbor','Boat','Cruise'],
  'luau':         ['Luau','Hawaiian culture','Hula dance','Polynesian culture'],
  'safari':       ['Safari','Game drive','Wildlife','African savanna','Wild animal'],
  'snorkeling':   ['Snorkeling','Coral reef','Underwater','Marine life','Tropical fish'],
  'diving':       ['Scuba diving','Coral reef','Underwater photography','Marine life'],
  'horseback':    ['Horseback riding','Horse','Equestrian','Ranch'],
  'bungee':       ['Bungee jumping','Extreme sport','Adventure sport'],
  'skydiving':    ['Skydiving','Parachute','Aerial view'],
  'zip line':     ['Zip line','Canopy tour','Adventure park'],
  'hot air':      ['Hot air balloon','Balloon flight','Aerial view'],
  'roller coaster':['Roller coaster','Amusement park','Theme park','Fairground'],
  'theme park':   ['Amusement park','Theme park','Roller coaster','Fairground'],
  'haunted':      ['Haunted house','Gothic architecture','Castle','Mystery tour'],
  'ghost':        ['Ghost tour','Historic district','Victorian architecture'],
  'comedy':       ['Comedy club','Stand-up comedy','Improv theater'],
  'jazz':         ['Jazz','Jazz club','Live music','New Orleans jazz'],
  'blues':        ['Blues music','Blues club','Live music','Chicago blues'],
  'karaoke':      ['Karaoke','Karaoke bar','Entertainment'],
  'escape room':  ['Escape room','Puzzle','Game room'],
  'bowling':      ['Bowling','Bowling alley','Ten-pin bowling'],
  'billiards':    ['Billiards','Pool','Snooker'],
  'rooftop':      ['Rooftop','Rooftop bar','Skyline','City view'],
  'nightclub':    ['Nightclub','Dance club','Electronic music','DJ'],
  'bar crawl':    ['Bar','Pub crawl','Nightlife','Beer'],
  'pub':          ['Pub','Irish pub','British pub','Tavern'],
  'distillery':   ['Distillery','Whiskey','Bourbon','Rum','Whisky distillery'],
  'cemetery':     ['Cemetery','Historic cemetery','Gothic','Mausoleum'],
  'ruins':        ['Ancient ruins','Archaeological site','Roman ruins','Temple ruins'],
  'neighborhood': ['Neighbourhood','Urban exploration','Street photography','City walk','Pedestrian street'],
  'neighbourhood':['Neighbourhood','Urban exploration','Street photography','City walk','Pedestrian street'],
  'quarter':      ['Historic district','Neighbourhood','Urban area','Old town','City quarter'],
  'district':     ['Historic district','Neighbourhood','Urban area','City district','Street photography'],
  'area':         ['Neighbourhood','Urban area','City walk','Street photography','Plaza'],
  'walk':         ['Walking tour','City walk','Pedestrian street','Waterfront','Promenade'],
  'drive':        ['Scenic route','Boulevard','Road trip','Highway','Scenic road'],
  'road':         ['Boulevard','Pedestrian street','Shopping street','Avenue','Promenade'],
  'lane':         ['Alley','Narrow street','Old town','Urban exploration','Shopping street'],
  'street':       ['Street photography','Pedestrian street','Shopping street','Urban exploration','Alley'],
  'centre':       ['Shopping mall','City centre','Urban area','Town centre','Market'],
  'center':       ['Shopping mall','City center','Urban area','Shopping street','Market'],
  'mall':         ['Shopping mall','Shopping center','Retail','Department store','Shopping street'],
  'shopping':     ['Shopping mall','Shopping street','Retail district','Boutique','Fashion'],
  'wharf':        ['Waterfront','Harbor','Dock','Marina','Pier'],
  'pier':         ['Pier','Waterfront','Harbor','Marina','Beach'],
  'harbor':       ['Harbor','Marina','Waterfront','Port','Boat'],
  'harbour':      ['Harbour','Marina','Waterfront','Port','Boat'],
  'port':         ['Port','Harbor','Waterfront','Ship','Marine'],
  'train':        ['Train station','Railway station','Rail transport','Commuter rail'],
  'railway':      ['Railway station','Train station','Heritage railway','Historic station'],
  'station':      ['Train station','Railway station','Grand Central Terminal','Metro station'],
  'old town':     ['Old town','Historic district','Medieval city','Ancient city','Town square'],
  'night life':   ['Nightlife','Bar','Nightclub','Entertainment district','City at night'],
  'night out':    ['Nightlife','Bar','Nightclub','Entertainment district'],
  'pub crawl':    ['Pub crawl','Bar','Nightlife','Beer','Pub'],
  'food tour':    ['Food tour','Street food','Culinary tourism','Food market','Guided tour'],
  'street art':   ['Street art','Mural','Graffiti art','Urban art','Banksy'],
  'mural':        ['Mural','Street art','Public art','Urban art'],
  'market hall':  ['Market hall','Food market','Indoor market','Borough Market'],
  'float':        ['Float','Water festival','Lantern festival','Cultural festival'],
  'lantern':      ['Lantern festival','Chinese New Year','Festival','Paper lantern'],
  'luau':         ['Luau','Hawaiian culture','Hula dance','Polynesian culture'],
  'plantation':   ['Plantation','Agriculture','Coffee plantation','Tea plantation'],
  'coffee farm':  ['Coffee plantation','Coffee','Agricultural tourism'],
  'cable car':    ['Cable car','Funicular','Aerial tramway','Mountain railway'],
  'tram':         ['Tram','Light rail','Street car','Historic tram'],
  'ferry':        ['Ferry','Water transport','Boat','Harbor ferry'],
  'boat':         ['Boat','Harbor','Water transport','River cruise','Canal boat'],
  'scenic':       ['Scenic route','Viewpoint','Panorama','Landscape','Vista'],
  'panorama':     ['Panorama','Viewpoint','City panorama','Vista','Observation deck'],
  'lookout':      ['Viewpoint','Observation deck','Lookout tower','Vista','Panorama'],
  'cliff':        ['Cliff','Coastal cliff','Scenic overlook','Natural landscape'],
  'reef':         ['Coral reef','Snorkeling','Underwater','Marine life','Tropical fish'],
  'lagoon':       ['Lagoon','Tropical water','Blue water','Resort','Beach'],
  'jungle':       ['Jungle','Rainforest','Forest walk','Tropical forest','Wildlife'],
  'rainforest':   ['Rainforest','Tropical forest','Canopy walk','Nature'],
  'volcano':      ['Volcano','Volcanic landscape','Lava','Geothermal','National park'],
  'glacier':      ['Glacier','Ice','Mountain','Alpine','Snow'],
  'dune':         ['Sand dune','Desert','Sahara','Dune landscape'],
  'desert':       ['Desert','Sand dune','Sahara','Arid landscape','Camel'],
  'savanna':      ['Savanna','African savanna','Wildlife','Grassland'],
  'temple complex':['Temple complex','Buddhist temple','Hindu temple','Ancient ruins'],
  'palace complex':['Palace','Royal palace','Château','Historic building'],
  'flower':       ['Flower market','Botanical garden','Tulip','Rose garden','Flower field'],
  'antique':      ['Antique market','Flea market','Secondhand','Vintage clothing'],
  'vintage':      ['Vintage clothing','Thrift store','Flea market','Secondhand'],
  'bookshop':     ['Bookstore','Library','Literary culture','Book'],
  'bookstore':    ['Bookstore','Library','Books','Book fair'],
  'art walk':     ['Art walk','Art gallery','Street art','Public art','Exhibition'],
  'graffiti':     ['Graffiti art','Street art','Urban art','Mural'],
  'pop-up':       ['Pop-up market','Food truck','Street market','Food festival'],
  'flea market':  ['Flea market','Antique market','Thrift store','Marketplace'],
  'craft market': ['Craft market','Artisan market','Handmade','Marketplace'],
  'souk':         ['Souk','Bazaar','Market','Middle Eastern market','Spice market'],
  'bazaar':       ['Bazaar','Market','Souk','Turkish bazaar','Grand Bazaar'],
  'medina':       ['Medina','Old city','Islamic architecture','Mosque','Souk'],
  'kasbah':       ['Kasbah','Moroccan architecture','Fortress','North Africa'],
};

/* Deterministic hash for picking from an array */
function nameHash(s) {
  let h = 5381;
  for (let i=0;i<s.length;i++) h=((h<<5)+h)^s.charCodeAt(i);
  return Math.abs(h);
}

/* Find best activity category key for an activity name */
function activityKey(name) {
  const n = name.toLowerCase();
  for (const kw of Object.keys(ACTIVITY_VARIATIONS)) {
    if (n.includes(kw)) return kw;
  }
  return null;
}

/* Find cuisine variations with exact → case-insensitive → partial fallback */
function findCuisineVariations(cuisine) {
  if (!cuisine) return null;
  // Exact match
  if (CUISINE_VARIATIONS[cuisine]) return CUISINE_VARIATIONS[cuisine];
  // Case-insensitive exact
  const keys = Object.keys(CUISINE_VARIATIONS);
  const lower = cuisine.toLowerCase();
  let k = keys.find(k => k.toLowerCase() === lower);
  if (k) return CUISINE_VARIATIONS[k];
  // Cuisine contains a known key (longest match wins)
  const contained = keys
    .filter(k => lower.includes(k.toLowerCase()))
    .sort((a,b) => b.length - a.length);
  if (contained.length) return CUISINE_VARIATIONS[contained[0]];
  // Known key contains the cuisine string
  const containing = keys
    .filter(k => k.toLowerCase().includes(lower))
    .sort((a,b) => a.length - b.length);
  if (containing.length) return CUISINE_VARIATIONS[containing[0]];
  return null;
}

/* Apply a URL to data.js for an item by name */
function applyPhoto(src, name, url) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `(["']?name["']?\\s*:\\s*["']${esc}["'][\\s\\S]{0,700}?["']?photo["']?\\s*:\\s*["'])([^"']+)(["'])`,
    'g'
  );
  const after = src.replace(re, `$1${url}$3`);
  return { src: after, changed: after !== src };
}

/* ── Main ── */
async function main() {
  console.log('Parsing data.js…');
  const rawSrc = fs.readFileSync('./data.js','utf8');

  const citiesStart = rawSrc.indexOf('const CITIES');
  const citiesEnd   = rawSrc.indexOf('\nconst REWARDS_CARDS');
  let citiesCode = rawSrc.slice(citiesStart, citiesEnd > 0 ? citiesEnd : rawSrc.length);
  citiesCode = citiesCode.replace(/\bconst\b/g,'var').replace(/\blet\b/g,'var');
  let CITIES;
  try { const ctx=vm.createContext({}); vm.runInContext(citiesCode,ctx); CITIES=ctx.CITIES; }
  catch(e) { console.error('Parse error:',e.message); process.exit(1); }

  // Identify still-generic photo IDs (used 20+ times)
  const photoCount = {};
  const idRe = /photo-([A-Za-z0-9_-]+)\?/g;
  let m;
  while ((m=idRe.exec(rawSrc))!==null) photoCount[m[1]]=(photoCount[m[1]]||0)+1;
  const GENERIC_IDS = new Set(Object.entries(photoCount).filter(([,n])=>n>=20).map(([id])=>id));
  console.log(`${GENERIC_IDS.size} generic IDs (20+ uses). Building article cache…`);

  // Collect unique (cuisine→articles) and (activityKey→articles) lookups needed
  const articleCache = {}; // article title → photo URL
  const needed = []; // { itemName, cuisine OR activityKey }

  for (const city of CITIES.filter(Boolean)) {
    for (const item of [...(city.activities||[]), ...(city.food||[])].filter(Boolean)) {
      if (!item.name || !item.photo) continue;
      const id = item.photo.match(/photo-([A-Za-z0-9_-]+)/)?.[1];
      if (!id || !GENERIC_IDS.has(id)) continue; // already specific
      needed.push({ item, cityName: city.name });
    }
  }
  console.log(`${needed.length} items need variation photos.`);

  // Collect ALL article titles we'll need (entire variation lists, not just one per item)
  const articlesNeeded = new Set();
  for (const { item } of needed) {
    const cuisine = item.cuisine;
    const variations = cuisine ? findCuisineVariations(cuisine) : null;
    const actKey = !cuisine ? activityKey(item.name) : null;
    const actVariations = actKey ? ACTIVITY_VARIATIONS[actKey] : null;
    const list = variations || actVariations || null;
    if (list) {
      // Fetch all articles in the list so we can fallback
      list.forEach(a => articlesNeeded.add(a));
    }
  }
  console.log(`Fetching ${articlesNeeded.size} unique Wikipedia articles…`);

  // Fetch all needed articles
  let fetched=0;
  for (const title of articlesNeeded) {
    const url = await wikiPhoto(title);
    articleCache[title] = url;
    fetched++;
    if (fetched % 20 === 0) process.stdout.write(`\r  ${fetched}/${articlesNeeded.size} articles fetched…`);
    await sleep(100);
  }
  console.log(`\n${fetched} articles fetched, ${Object.values(articleCache).filter(Boolean).length} with photos.`);

  // Apply photos to data.js
  let src = rawSrc;
  let patched=0, novar=0, nophoto=0;

  for (const { item } of needed) {
    const cuisine = item.cuisine;
    const variations = cuisine ? findCuisineVariations(cuisine) : null;
    const actKey = !cuisine ? activityKey(item.name) : null;
    const actVariations = actKey ? ACTIVITY_VARIATIONS[actKey] : null;
    const list = variations || actVariations || null;

    if (!list) { novar++; continue; }

    // Try articles starting at hash offset, cycle through if no photo
    const h = nameHash(item.name);
    let url = null;
    for (let i = 0; i < list.length; i++) {
      const title = list[(h + i) % list.length];
      if (articleCache[title]) { url = articleCache[title]; break; }
    }
    if (!url) { nophoto++; continue; }

    const { src: newSrc, changed } = applyPhoto(src, item.name, url);
    if (changed) { src = newSrc; patched++; }
  }

  fs.writeFileSync('./data.js', src);
  console.log(`\nDone: ${patched} patched, ${novar} no variation list, ${nophoto} article had no photo`);
}

main().catch(console.error);
