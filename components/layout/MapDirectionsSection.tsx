"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Navigation, Clock3 } from "lucide-react";

export default function MapDirectionsSection() {
  return (
    <section className="mx-auto w-full md:max-w-[90dvw] max-w-[98dvw] bg-transparent sm:px-8 md:pb-16">
      <Card className="overflow-hidden border-brown/20 bg-cream/30 shadow-sm backdrop-blur-sm py-0 rounded-none md:rounded-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <CardContent className="p-0">
            <div className="h-full min-h-[320px] w-full ">
              <iframe
                title="Tiripon Resort Map"
                src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3897.451553329892!2d123.66565824504222!3d13.332453985177361!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTPCsDE5JzU2LjgiTiAxMjPCsDQwJzAxLjciRQ!5e1!3m2!1sen!2sph!4v1778757888174!5m2!1sen!2sph"
                className="h-full min-h-[420px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </CardContent>

          <CardHeader className="space-y-5 p-6 sm:p-8">
            <Badge
              variant="secondary"
              className="w-fit border border-brown/20 bg-cream text-brown"
            >
              Visit Us
            </Badge>

            <CardTitle className="font-googlesansflex text-2xl text-brown sm:text-3xl">
              Find Tiripon Resort with Ease
            </CardTitle>

            <div className="space-y-4 text-brown/85">
              <p className="flex items-start gap-3 leading-7">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-brown" />
                Zone 8 Basagan, Tabaco City, Albay, Philippines
              </p>
              <p className="flex items-start gap-3 leading-7">
                <Navigation className="mt-1 h-5 w-5 shrink-0 text-brown" />
                From Tabaco City proper, head toward Basagan Road and follow
                signs to Tiripon Resort. The route is accessible by private car,
                tricycle, or local transport.
              </p>
              <p className="flex items-start gap-3 leading-7">
                <Clock3 className="mt-1 h-5 w-5 shrink-0 text-brown" />
                Best arrival window is before noon for smoother check-in and
                parking.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-brown text-cream hover:bg-brown/90">
                    Best Route for 2-3 Wheels
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-brown/20 bg-cream text-brown sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle className="font-googlesansflex text-2xl">
                      Best Route for 2-3 Wheels
                    </DialogTitle>
                    <DialogDescription className="text-brown/80">
                      Recommended for motorcycles, tricycles, and other
                      lightweight vehicles.
                    </DialogDescription>
                  </DialogHeader>
                  <p className="text-sm leading-7 text-brown/85 sm:text-base">
                    Take Basagan Road via inner barangay access roads for a
                    faster entry and easier maneuvering in narrower turns.
                  </p>
                  <div className="overflow-hidden rounded-lg border border-brown/15">
                    <Image
                      src="/images/2-motor.png"
                      alt="Best route map for 2-3 wheel vehicles"
                      width={1200}
                      height={800}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                  <DialogFooter showCloseButton />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-brown/30 text-brown hover:bg-brown/5"
                  >
                    Best Route for 4 Wheels
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-brown/20 bg-cream text-brown sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle className="font-googlesansflex text-2xl">
                      Best Route for 4 Wheels
                    </DialogTitle>
                    <DialogDescription className="text-brown/80">
                      Recommended for cars, vans, and other 4-wheel vehicles.
                    </DialogDescription>
                  </DialogHeader>
                  <p className="text-sm leading-7 text-brown/85 sm:text-base">
                    Use the wider main approach route from Tabaco City proper to
                    Basagan Road, then follow posted signs to Tiripon Resort for
                    safer clearance and easier parking access.
                  </p>
                  <div className="overflow-hidden rounded-lg border border-brown/15">
                    <Image
                      src="/images/4-wheels.png"
                      alt="Best route map for 4-wheel vehicles"
                      width={1200}
                      height={800}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                  <DialogFooter showCloseButton />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </div>
      </Card>
    </section>
  );
}
