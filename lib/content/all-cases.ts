// Every case file, imported directly so it is bundled into the app (no file
// reading at run time). When you add a file to content/cases/, add it here too:
// tests/content-library.test.ts fails if a file is missing from this list.
import aurora from "@/content/cases/aurora-kitchen-uk-entry.json";
import bramblecup from "@/content/cases/bramblecup-uk-supermarket-deal.json";
import brinmoor from "@/content/cases/brinmoor-bike-share-repairs.json";
import calder from "@/content/cases/calder-instruments-currency-risk.json";
import evChargers from "@/content/cases/city-ev-chargers.json";
import cobalt from "@/content/cases/cobalt-basin-ski-resort.json";
import cobbleway from "@/content/cases/cobbleway-parcel-hub.json";
import corvane from "@/content/cases/corvane-vets-acquisition.json";
import cragwell from "@/content/cases/cragwell-climbing-growth.json";
import fellwick from "@/content/cases/fellwick-garden-centres-growth.json";
import fennick from "@/content/cases/fennick-software-ipo-or-sale.json";
import fernmoor from "@/content/cases/fernmoor-dental-clear-aligners.json";
import flexora from "@/content/cases/flexora-gym-software-pricing.json";
import harbourline from "@/content/cases/harbourline-bakeries.json";
import harlow from "@/content/cases/harlow-building-society-branches.json";
import hartstow from "@/content/cases/hartstow-storage-demand.json";
import hollinsway from "@/content/cases/hollinsway-pet-insurance.json";
import hollowlatch from "@/content/cases/hollowlatch-escape-rooms-birmingham.json";
import kelstow from "@/content/cases/kelstow-luggage-lost-share.json";
import lanebrook from "@/content/cases/lanebrook-swim-schools-due-diligence.json";
import larchmere from "@/content/cases/larchmere-padel-new-city-club.json";
import larkmoor from "@/content/cases/larkmoor-meal-kit-acquisition.json";
import londonCargo from "@/content/cases/london-cargo-bikes.json";
import lumen from "@/content/cases/lumen-tutoring-growth.json";
import orvessa from "@/content/cases/orvessa-subscriber-growth.json";
import ostrander from "@/content/cases/ostrander-pumps-sensor-deal.json";
import pellbrook from "@/content/cases/pellbrook-clinics-waiting-times.json";
import quillmere from "@/content/cases/quillmere-packaging-term-loan.json";
import silverbeck from "@/content/cases/silverbeck-hospital-laundry-bid.json";
import sorrelby from "@/content/cases/sorrelby-houseplant-delivery.json";
import stowline from "@/content/cases/stowline-backup-pricing.json";
import tarnmoor from "@/content/cases/tarnmoor-water-leak-sensors.json";
import thornbury from "@/content/cases/thornbury-foods-snack-deal.json";
import dogWalking from "@/content/cases/us-dog-walking-market.json";
import wrenfield from "@/content/cases/wrenfield-hotels-profit.json";
import wyncliffe from "@/content/cases/wyncliffe-young-savers-app.json";

// In case-id order (case-001 first): the order the library lists them in.
export const rawCases: unknown[] = [
  harbourline,
  aurora,
  evChargers,
  flexora,
  lumen,
  corvane,
  ostrander,
  cobbleway,
  wrenfield,
  stowline,
  pellbrook,
  brinmoor,
  bramblecup,
  hollinsway,
  orvessa,
  londonCargo,
  dogWalking,
  cragwell,
  larkmoor,
  cobalt,
  // Bank-style case studies (track "banking", founder 16 Oct 2026)
  thornbury,
  quillmere,
  wyncliffe,
  harlow,
  calder,
  fennick,
  // Firm-style consulting cases (clean-room, 16 Oct 2026)
  tarnmoor,
  fellwick,
  larchmere,
  kelstow,
  fernmoor,
  sorrelby,
  lanebrook,
  silverbeck,
  hollowlatch,
  hartstow,
];
