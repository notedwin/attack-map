#[macro_use]
extern crate rocket;

use rustypi::hacker_json;

use rocket::{fs::FileServer};
use rocket_dyn_templates::{Template,context};


#[get("/")]
fn index() -> Template {
    let (h_string, h_len) = hacker_json().unwrap();
    Template::render("index", context! {name: h_string, len: h_len})
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![index])
        .mount("/static", FileServer::from("static/"))
        .attach(Template::fairing())
}