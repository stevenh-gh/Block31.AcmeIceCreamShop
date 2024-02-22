const express = require("express");
const pg = require("pg");
const app = express();
const client = new pg.Client(process.env.DATABASE_URL || "postgres://localhost/acme_ice_cream_shop");

app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/flavors", async (req, res, next) =>
{
	const SQL = `
			select * from flavors;
	`;
	const results = await client.query(SQL);
	res.send(results.rows);
});
app.get("/api/flavors/:id", async (req, res, next) =>
{
	const SQL = `
		select * from flavors
		where id = $1;
	`;
	const results = await client.query(SQL, [req.params.id]);
	res.send(results.rows);
});
app.post("/api/flavors", async (req, res, next) =>
{
	const SQL = `
		insert into flavors
			(name, is_favorite)
		values
			($1, $2)
		returning *;
	`;
	const results = await client.query(SQL, [req.body.name, req.body.is_favorite]);
	res.send(results);
});
app.delete("/api/flavors/:id", async (req, res, next) =>
{
	const SQL = `
			delete from flavors
			where id = $1
	`;
	await client.query(SQL, [req.params.id]);
	res.sendStatus(204);
});
app.put("/api/flavors/:id", async (req, res, next) =>
{
	const SQL = `
		update flavors
		set
			name = $1,
			is_favorite = $2,
			updated_at = now()
		where
			id = $3
		returning *;
	`;
	const results = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
	res.send(results.rows[0]);
});

const init = async () =>
{
	console.log("connecting to db");
	client.connect();
	console.log("connected to db");

	console.log("seeding db");
	let sql = `
		drop table if exists flavors;
		create table flavors(
			id serial primary key,
			name varchar(255) not null,
			is_favorite boolean,
			created_at timestamp default now(),
			updated_at timestamp default now()
		);

		insert into flavors
			(name, is_favorite)
		values
			('vanilla', false),
			('mint', true),
			('choco chip', false),
			('oreo', true);
	`;
	await client.query(sql);
	console.log("seeded db");

	const PORT = 3000;
	app.listen(PORT, () =>
	{
		console.log(`listening on port ${PORT}`);
	});
};

init();
