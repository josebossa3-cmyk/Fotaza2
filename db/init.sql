create table usuarios(
    id int primary key auto_increment,
    nombre varchar(255) not null,
    email varchar(255) not null unique,
    password varchar(255) not null
)