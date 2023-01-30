# Uncomment this to pass the first stage
import socket
import selectors

sel = selectors.DefaultSelector()

def main():
    # You can use print statements as follows for debugging, they'll be visible when running tests.
    print("Logs from your program will appear here!")

    # Uncomment this to pass the first stage
    #

    with socket.create_server(("localhost", 6379), reuse_port=True) as server:
        print("Server is listening on port 6379")
        server.listen()
        
        sel.register(server, selectors.EVENT_READ, data=None)

        while True:
            events = sel.select(timeout=None)
            for key, mask in events:
                if key.data is None:
                    accept_wrapper(key.fileobj)
                else:
                    service_connection(key, mask)        


        while True:
            client_socket, client_address = server.accept()
            print("Client connected from", client_address)
            client_socket.send(b"Hello, world!")
            client_socket.close()


    server_socket = socket.create_server(("localhost", 6379), reuse_port=True)

    # create an event loop
    while True:
        client_connection, _ = server_socket.accept()  # wait for client
        # count the number of pongs received
        pongs = 0
        while True:
            data = client_connection.recv(1024)
            if not data:
                break
            if data == b"PONG":
                pongs += 1
            else:
                print(data)
        print("Pongs:", pongs)
        client_connection.send(b"+PONG\r\n")

if __name__ == "__main__":
    main()
