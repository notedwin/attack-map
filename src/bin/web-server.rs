#[macro_use]
extern crate rocket;

use rustypi::hacker_json;

use rocket::{fs::FileServer};
use rocket_dyn_templates::{Template,context};
use diesel::prelude::*;
use diesel::pg::PgConnection;
use dotenv::dotenv;
use once_cell::sync::Lazy;

static global_db: Lazy<Pool<PgConnection>> = Lazy::new(|| {
    let manager = ConnectionManager::<PgConnection>::new(&*DATABASE_URL);
    Pool::builder().build(manager).expect("Failed to create pool.")
});


#[get("/")]
fn index() -> Template {
    let (h_string, h_len) = hacker_json().unwrap();
    Template::render("index", context! {name: h_string, len: h_len})
    // pull hackers from database
    // let hackers = hackers::table.load::<Hacker>(&*POOL.get().unwrap()).unwrap();
}




#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![index])
        .mount("/static", FileServer::from("static/"))
        .attach(Template::fairing())
}