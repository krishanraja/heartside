# The 13 Answers articles added on 10 Nov 2026 (Krish: "11 out of 10 discoverable in every way by SEO and GEO").
# Source of truth for what was published to the store's Answers blog; facts from docs/SELLING.md.
H = 'https://heartside.io'
MUG, BLANKET, PORTRAIT = H + '/products/your-dogs-illustrated-mug', H + '/products/your-dogs-personality-blanket', H + '/products/your-dogs-portrait'
HOW = (f'<h2>How Heartside does it</h2><p><a href="{H}/">Heartside</a> paints your dog from one photo onto an '
       f'<a href="{MUG}">illustrated mug</a> ($45), a <a href="{BLANKET}">sherpa blanket</a> ($129) or a '
       f'<a href="{PORTRAIT}">12 × 18 inch portrait</a> ($59 unframed, $119 framed in black, white or red oak). '
       'You see the painting before it goes in your cart. Each gift carries the painting only; a short note in your dog\'s own voice '
       'comes in the box and on a free digital card. A person checks every order before it prints, and shipping is free on every US order. '
       'Order by December 4 for Christmas delivery to a US address.</p>')
def rel(*qa): return '<h2>Related questions</h2><ul>' + ''.join(f'<li><strong>{q}</strong> {a}</li>' for q, a in qa) + '</ul>'

A = [
 dict(handle='custom-dog-mug-from-a-photo', title='How do you get a custom dog mug made from a photo?', tags=['answers','mug','how-it-works','christmas'],
  summary='Upload one clear photo of your dog, pick a painting style and check the artwork before you order. Heartside paints your dog all the way around an 11 oz ceramic mug for $45, with a black, dark blue, dark green, red or pink inside, and free US shipping.',
  body='<p>A custom dog mug starts with one good photo. The difference between a mug people keep on the shelf and one they use every morning is the artwork: a painting of the dog, not a photo stretched around a cup.</p>'
  '<h2>The three steps</h2><ul><li><strong>Add a photo.</strong> One dog, facing the camera, in daylight. A phone photo is fine.</li><li><strong>Choose the look and the feel.</strong> Painterly, comic book, fine ink, screenprint and more, then a tone: Sentimental, Warm, Hilarious or Roast.</li><li><strong>Check the painting.</strong> It takes about a minute, and you see it on the mug before it goes in your cart.</li></ul>'
  '<h2>What you get</h2><p>An 11 oz ceramic mug, painted all the way around, with a black, dark blue, dark green, red or pink inside, rim and handle. No words are printed on it. The note from your dog travels in the box.</p>'
  '<h2>Why a painting beats a photo print</h2><p>A painting smooths out a busy background and odd lighting, and it holds up on a curved surface. It also looks like a gift rather than a phone snapshot.</p>'
  + HOW + rel(('How much is it?','$45, with free shipping on every US order.'),('Can I order two or three gifts?','Yes. Two gifts save 15% and three or more save 20%, applied automatically.'),('Can I choose the color inside?','Yes: black, dark blue, dark green, red or pink.'))),
 dict(handle='blanket-with-your-dogs-face', title="Where can I get a blanket with my dog's face on it?", tags=['answers','blanket','how-it-works','christmas'],
  summary="Heartside makes a 50 × 60 inch sherpa blanket covered in your dog's painting, made from one photo you upload. It is $129 with free US shipping, and you see the painting before you order.",
  body='<p>A blanket with your dog on it works best when the dog is painted, not pasted. Heartside paints your dog from your photo and repeats the painting across a soft sherpa blanket.</p>'
  '<h2>What it is</h2><ul><li>50 × 60 inches, with soft sherpa.</li><li>Your dog painted from your photo, in the style you choose.</li><li>No words printed on it. The note from your dog comes in the box.</li></ul>'
  '<h2>Who it suits</h2><p>The person the dog sleeps on. The couch the dog has claimed. A grandparent who misses the dog between visits.</p>'
  '<h2>Getting the photo right</h2><p>Use a clear photo where the dog fills a good part of the frame and its face is sharp. If a photo will not work, you are told why before anything is made.</p>'
  + HOW + rel(('How much is the blanket?','$129, with free US shipping.'),('Can I see it first?','Yes. You review the painting before it goes in your cart.'),('Will it arrive by Christmas?','Order by December 4 for delivery to a US address.'))),
 dict(handle='turn-a-photo-of-your-dog-into-a-painting', title='How do you turn a photo of your dog into a painted portrait?', tags=['answers','portrait','how-it-works'],
  summary='Upload a clear photo of your dog to Heartside, choose a style such as painterly, comic book or fine ink, and the painter paints it in about a minute. Order it as a 12 × 18 inch portrait, $59 unframed or $119 framed in black, white or red oak.',
  body='<p>You do not need an artist on retainer to get your dog painted. You need one good photo and a few minutes.</p>'
  '<h2>Pick a style that fits the dog</h2><ul><li><strong>Painterly</strong> for a warm, classic portrait.</li><li><strong>Comic book</strong> for a dog with a big personality.</li><li><strong>Fine ink</strong> for a clean, graphic look.</li><li><strong>Vintage screenprint</strong> and <strong>cut-paper collage</strong> for something bolder.</li></ul>'
  '<h2>Choose a feel</h2><p>Sentimental, Warm, Hilarious, or Roast, where the dog teases the person it loves, gently. The feel shapes the scene and the note.</p>'
  '<h2>Frame it or not</h2><p>The 12 × 18 inch portrait comes unframed for $59, or framed for $119 in black, white or red oak.</p>'
  + HOW + rel(('How long does the painting take?','About a minute, and you see it before you buy.'),('Can I use an old photo?','Yes, if the dog is clear and its face is sharp.'))),
 dict(handle='best-photo-for-a-custom-dog-portrait', title='What makes a good photo for a custom dog portrait?', tags=['answers','photo','how-it-works'],
  summary="One dog, facing the camera, in good daylight, with its face sharp and filling a good part of the picture. A phone photo is fine. Avoid photos where the dog is far away, blurred or half hidden.",
  body='<p>The photo decides how much of your dog ends up in the painting. A few seconds choosing the right one pays off.</p>'
  '<h2>What works</h2><ul><li><strong>One dog.</strong> If there are two, crop to the one you want.</li><li><strong>The face, sharp.</strong> Eyes in focus matter most.</li><li><strong>Daylight.</strong> Near a window beats a flash.</li><li><strong>Close enough.</strong> The dog should fill a good part of the frame.</li></ul>'
  '<h2>What to avoid</h2><ul><li>A dog in the far distance.</li><li>Motion blur from a dog mid-zoomie.</li><li>Heavy filters that change the coat color.</li></ul>'
  '<h2>Where to find one</h2><p>Your camera roll from the last year, or the photos you have already posted. For a gift, a friend\'s own posts are often the best source.</p>'
  + HOW + rel(('What if my photo is not good enough?','You are told why before anything is made, so there is no risk.'),('Can the painting include a toy or collar?',"Yes. The Artist's touch, an optional add-on, paints your dog's toy or collar from your photos."))),
 dict(handle='what-should-a-note-from-the-dog-say', title='What should a note from the dog say?', tags=['answers','from-the-dog','note'],
  summary='A note from the dog should name real habits in the dog\'s own voice, then sign off with its name. "I hear your car long before anyone else. I took your side of the bed to keep it warm. Love, Maple." Three short lines beat a long letter.',
  body='<p>The note is the part people read twice. It works when it sounds like this particular dog, talking straight to the person it loves.</p>'
  '<h2>Write it as the dog</h2><p>"I" is the dog, "you" is the person. Name things the dog really does:</p><blockquote><p>I hear your car long before anyone else.<br>I took your side of the bed to keep it warm.<br>Our walks are the best part of my day.</p></blockquote>'
  '<h2>Match the personality</h2><p>A Border Collie keeps track of everything. A Beagle notices the world nose first. A Frenchie acts like a tiny CEO. The same habit sounds different from each.</p>'
  '<h2>Or let it roast you</h2><p>Some dogs have opinions. In Roast, the dog teases the person it loves: who throws the ball badly, who steals the couch. One buyer, Mike T. in Denver, said his dog called his girlfriend "a terrible ball thrower."</p>'
  '<h2>Sign it</h2><p>End with "Love," and the dog\'s name. It is the line people point at.</p>'
  + HOW + rel(('What if I do not know what to write?','Buddy asks a few tap-to-answer questions about your dog, and the note is written from your answers.'),('Is the note printed on the gift?','No. The gift carries the painting only; the note comes in the box and on a free digital card.'))),
 dict(handle='gift-for-a-dog-mom', title='What is a good gift for a dog mom?', tags=['answers','from-the-dog','dog-mom','christmas'],
  summary="Give her her own dog, painted. A mug ($45), a sherpa blanket ($129) or a portrait (from $59) painted from her dog's photo, with a note from the dog in the box, is the one gift she cannot already own.",
  body='<p>Dog moms already have the paw-print socks. What they do not have is their own dog, painted, with a note that sounds exactly like it.</p>'
  '<h2>Pick by her routine</h2><ul><li><strong>The mug</strong> if her mornings start with the dog and coffee.</li><li><strong>The blanket</strong> if the dog sleeps on her, every night.</li><li><strong>The portrait</strong> for the wall she walks past every day.</li></ul>'
  '<h2>Get the photo quietly</h2><p>Her own posts are the best source. One clear photo with the dog\'s face in focus is enough.</p>'
  '<h2>Make it from the dog</h2><p>The note comes in the dog\'s voice and ends with its name. "Love, Daisy" turns a nice gift into one the dog gave.</p>'
  + HOW + rel(('Can I send it straight to her?','Yes. Enter her address at checkout. Shipping is free in the US.'),('What if I want more than one?','Two gifts save 15% and three or more save 20%.'))),
 dict(handle='gift-for-a-dog-dad', title='What is a good gift for a dog dad?', tags=['answers','from-the-dog','dog-dad','christmas'],
  summary="A mug with his dog painted all the way around ($45) is the gift he will actually use, every morning. For the couch, a sherpa blanket with the dog on it ($129). Both come with a note from the dog in the box.",
  body='<p>Dog dads are hard to buy for and easy to win over: anything with their dog on it.</p>'
  '<h2>The everyday one</h2><p>An 11 oz mug, painted all the way around, black inside. It goes from the shelf to his desk and back, which means he sees the dog every morning.</p>'
  '<h2>The couch one</h2><p>A 50 × 60 inch sherpa blanket covered in the dog\'s painting, for the guy who watches the game with the dog on his feet.</p>'
  '<h2>Let the dog roast him</h2><p>Pick the Roast tone and the note teases him, gently. One customer, Christopher J. in Chicago, found out Winston thinks his husband is not great at sharing snacks.</p>'
  + HOW + rel(('How fast does it ship?','Printing usually takes 2 to 5 business days, then delivery another 3 to 7.'),('Is there a Christmas cutoff?','Order by December 4 for delivery to a US address.'))),
 dict(handle='birthday-gift-from-the-dog', title='What can I give someone for their birthday from the dog?', tags=['answers','from-the-dog','birthday'],
  summary="Give them something with the dog painted on it, signed by the dog. A mug, a blanket or a portrait painted from the dog's photo, with a short birthday note in the dog's voice in the box, reads as if the dog went shopping.",
  body='<p>A birthday gift from the dog is one of the few that makes people laugh first and tear up second.</p>'
  '<h2>Choose the gift</h2><ul><li><strong>A mug</strong> ($45) for the coffee drinker.</li><li><strong>A blanket</strong> ($129) for the napper.</li><li><strong>A portrait</strong> ($59 unframed, $119 framed) for a milestone birthday.</li></ul>'
  '<h2>Let the dog sign it</h2><p>The note names what the dog loves about them, in the dog\'s voice, and ends with "Love," and the dog\'s name.</p>'
  '<h2>Time it</h2><p>Each gift is made after you order. Printing usually takes 2 to 5 business days and delivery another 3 to 7, so order about two weeks ahead.</p>'
  + HOW + rel(('Can it go straight to them?','Yes. Enter their address at checkout.'),('Is there a free card?','Yes. Every gift comes with a free digital card from the dog.'))),
 dict(handle='secret-santa-gift-for-a-dog-lover-under-50', title='What is a good Secret Santa gift for a dog lover under $50?', tags=['answers','christmas','secret-santa','mug'],
  summary="A mug with their dog painted all the way around it, $45 with free US shipping. It is personal, it is under $50, and it comes with a note from their dog in the box. Order by December 4 for Christmas.",
  body='<p>Secret Santa rewards the person who knows one detail about you. For a dog lover, that detail is the dog.</p>'
  '<h2>The $45 option</h2><p>Heartside\'s illustrated mug: their dog, painted from a photo, all the way around an 11 oz ceramic mug, with a colored inside, rim and handle. Shipping is free in the US.</p>'
  '<h2>Getting a photo without giving it away</h2><p>Their own posts, a team chat, or a friend. One clear photo with the dog\'s face in focus is enough.</p>'
  '<h2>Keep it a secret</h2><p>Ship it to yourself to wrap, or straight to them. The note comes from the dog, so nobody needs to know who the Santa was.</p>'
  + HOW + rel(('What if I do not know the dog\'s habits?','Every question has a "Not sure" option, and a warm note still comes out.'),('When is the last day for Christmas?','Order by December 4 for delivery to a US address.'))),
 dict(handle='gift-for-someone-who-just-got-a-puppy', title='What do you get someone who just got a puppy?', tags=['answers','puppy','from-the-dog'],
  summary="Paint the puppy before it grows. A portrait or a mug painted from a puppy photo keeps that tiny face forever, and a note from the puppy in the box makes it the first gift the dog ever gave.",
  body='<p>New puppy owners take hundreds of photos and print none of them. A painted gift turns the best one into something they keep.</p>'
  '<h2>Catch the size</h2><p>Puppies change by the week. A portrait from this month\'s photo is a gift that gets better every year.</p>'
  '<h2>The practical pick</h2><p>A mug for the 6 a.m. potty breaks. They will be up early anyway.</p>'
  '<h2>The note</h2><p>Written in the puppy\'s voice, from what you know about it so far. Short works: it is a puppy.</p>'
  + HOW + rel(('Can I use a photo from their posts?','Yes. Use one where the puppy\'s face is clear and in focus.'),('Which style suits a puppy?','Painterly and fine ink both flatter a small face.'))),
 dict(handle='anniversary-gift-from-the-dog', title='What is a good anniversary gift from the dog?', tags=['answers','from-the-dog','anniversary','partner'],
  summary="A framed portrait of your dog ($119) with a note from the dog in the box. It marks the life you have built together, dog included, and it goes on a wall you both walk past every day.",
  body='<p>For many couples the dog is the first thing they raised together. An anniversary gift from the dog says that without anyone having to.</p>'
  '<h2>The framed portrait</h2><p>A 12 × 18 inch portrait in black, white or red oak, painted from your favorite photo of the dog. $119 framed, or $59 unframed if you have a frame in mind.</p>'
  '<h2>The note</h2><p>In the dog\'s voice, about the two of you: who it waits for at the door, whose side of the bed it steals, the walk it loves most.</p>'
  '<h2>Make it a set</h2><p>Add a mug or a blanket and save 15% on two gifts, or 20% on three.</p>'
  + HOW + rel(('Can the dog roast us both?','Yes. Pick the Roast tone and the dog teases, gently.'),('How long does it take?','Printing usually takes 2 to 5 business days, then delivery another 3 to 7.'))),
 dict(handle='how-long-does-a-custom-dog-gift-take', title='How long does a custom dog gift take to arrive?', tags=['answers','shipping','how-it-works','christmas'],
  summary="Printing usually takes 2 to 5 business days and US delivery another 3 to 7, so plan on one to two weeks. For Christmas, order by December 4. Shipping is free on every US order, and you get tracking by email.",
  body='<p>Custom gifts are made after you order, so they take longer than something off a shelf. Here is the honest timeline.</p>'
  '<h2>The steps</h2><ul><li><strong>Painting:</strong> about a minute, while you are on the site.</li><li><strong>Checking:</strong> a person looks at every order before it prints.</li><li><strong>Printing:</strong> usually 2 to 5 business days.</li><li><strong>Delivery:</strong> usually 3 to 7 business days in the US.</li></ul>'
  '<h2>Christmas</h2><p>Order by December 4 for Christmas delivery to a US address. Even at the slowest times, an order placed on December 4 arrives by December 22.</p>'
  '<h2>Tracking</h2><p>You get a tracking email when each parcel ships. Several gifts can arrive separately.</p>'
  + HOW + rel(('What if something arrives damaged?','Tell us within 30 days with a photo and we refund in full or remake it free. Nothing needs to be sent back.'),('Do you ship outside the US?','Not yet. US addresses only.'))),
 dict(handle='gift-for-mom-from-the-dog', title='What can I get my mom from the dog?', tags=['answers','from-the-dog','mom','family'],
  summary="Get her the family dog, painted, with a note from the dog. A mug ($45), a sherpa blanket ($129) or a portrait (from $59) painted from the dog's photo, with a short note signed with the dog's name, is the gift moms keep.",
  body='<p>Moms say they do not need anything. A gift from the dog is the exception, because it is not really from you.</p>'
  '<h2>What moms keep</h2><ul><li><strong>A portrait</strong> for the hallway, framed in black, white or red oak.</li><li><strong>A mug</strong> she will use every morning and show everyone who visits.</li><li><strong>A blanket</strong> for the chair the dog always takes.</li></ul>'
  '<h2>What the dog says</h2><p>The note comes in the dog\'s voice: what it notices about her, where it waits, what it loves. One customer, Jessica M. in Austin, said she "actually got emotional opening it."</p>'
  '<h2>Send it to her</h2><p>Enter her address at checkout. Shipping is free in the US.</p>'
  + HOW + rel(('Can siblings go in together?','Yes. Two gifts save 15%, three or more save 20%.'),('Is there a card?','Every gift comes with a free digital card from the dog. A printed card is a $12 add-on until December 3.'))),
]
